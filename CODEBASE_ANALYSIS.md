# AutoMindz Codebase Analysis: OAuth, Threading & Follow-ups

## 1. Google OAuth/Gmail Authentication Logic

### 1.1 User Login (Google OAuth)
**File:** [server/src/routes/auth.js](server/src/routes/auth.js#L180-L240)

**Flow:**
- **Step 1 - Generate Auth URL:** `GET /api/auth/google/url`
  - Uses `createLoginOAuth2Client()` with separate redirect URI for login
  - Generates state parameter (CSRF protection) stored in Redis with 5-min expiry
  - Requests `userinfo.email` and `userinfo.profile` scopes only

- **Step 2 - OAuth Callback:** `GET /api/auth/google/callback`
  - Validates state parameter from Redis
  - Exchanges code for tokens via `oauth2Client.getToken(code)`
  - Fetches user profile via Google OAuth2 API
  - Creates/Updates user in database
  - **CRITICAL SECURITY FIX:** Uses one-time code exchange instead of token in URL
  - Stores JWT in Redis with key `google_auth_code:{code}` (30-sec expiry)
  - Redirects to frontend with code: `{APP_URL}/auth/google/success?code={code}`

- **Step 3 - Token Exchange:** `GET /api/auth/google/token`
  - **File:** [server/src/routes/auth.js](server/src/routes/auth.js#L407-L420)
  - Frontend exchanges code for JWT from Redis
  - Validates Redis entry exists and retrieves token
  - Token is deleted immediately after retrieval

**Frontend Handler:** [client/src/pages/GoogleAuthSuccess.jsx](client/src/pages/GoogleAuthSuccess.jsx)
```javascript
// Exchanges code for token
api.get(`/auth/google/token?code=${code}`)
    .then(res => {
        setTokenAndUser(res.data.token);  // Stores JWT in AuthContext
    })
```

### 1.2 Gmail Account Connection (OAuth)
**File:** [server/src/routes/accounts.js](server/src/routes/accounts.js#L13-L71)

**Flow:**
- **Connect:** `GET /api/accounts/oauth/connect`
  - Creates OAuth URL using `getAuthUrl(userId)` from gmailOAuth.js
  - Uses HMAC-signed state parameter with userId (prevents spoofing)
  
- **Callback:** `GET /api/accounts/oauth/callback`
  - Verifies signed state parameter to extract userId
  - Exchanges code for tokens via `getTokensFromCode(code)`
  - Gets Gmail profile via `getGmailProfile(accessToken)`
  - **Saves/Updates GmailAccount with:**
    - `accessToken` (encrypted at rest)
    - `refreshToken` (encrypted at rest)
    - `tokenExpiresAt` (from Google response)
    - `connectionType: 'oauth'`

### 1.3 OAuth Token Management
**File:** [server/src/services/gmailOAuth.js](server/src/services/gmailOAuth.js#L52-L100)

**Key Features:**
- **Auto-Refresh Logic:** `getAuthenticatedClient(account)`
  - Checks if token expired or within 5-min buffer
  - Auto-refreshes via `oauth2Client.refreshAccessToken()`
  - Updates `account.accessToken`, `account.refreshToken`, `account.tokenExpiresAt`
  - On refresh failure: Sets `account.health = 'warning'` to alert user

**Token Storage:** [server/src/models/GmailAccount.js](server/src/models/GmailAccount.js#L40-75)
- Tokens encrypted before saving via `pre('save')` hook
- Tokens decrypted after reading via `post('findOne/find')` hooks
- API responses strip tokens via `toJSON()` method

---

## 2. Follow-up Scheduling Logic

### 2.1 Scheduler Process
**File:** [server/src/services/followUpScheduler.js](server/src/services/followUpScheduler.js)

**Cron Schedule:** Runs every 15 minutes
```javascript
cron.schedule('*/15 * * * *', () => {
    runScheduler();
});
```

**Main Scheduler Logic:** [Lines 330-380](server/src/services/followUpScheduler.js#L330-L380)

1. **Find Due Campaigns:**
   - Queries campaigns with `status: ['running', 'completed']`
   - Filters recipients with `sequenceStatus: 'active'` AND `nextFollowUpAt <= now`

2. **Process Each Recipient:** Calls `processRecipientFollowUp(campaign, recipient)`

### 2.2 Follow-up Processing Logic
**File:** [server/src/services/followUpScheduler.js](server/src/services/followUpScheduler.js#L48-290)

**Step-by-Step Process:**

#### Step 1: Check Auto-Stop Conditions
```javascript
// Check if recipient replied → auto-stop
const replied = await hasRecipientReplied(campaign._id, recipient.email);
if (replied) {
    // Stop sequence
    recipients.$.sequenceStatus = 'stopped_reply'
}

// Check if unsubscribed
const suppressed = await Suppression.findOne({...});
if (suppressed) {
    recipients.$.sequenceStatus = 'stopped_unsubscribe'
}
```

#### Step 2: Find Next Follow-up Step
- Gets `followUpStep` where `stepNumber = recipient.currentStep + 1`
- If no step found → marks sequence as `'completed'`

#### Step 3: Check Condition
- Evaluates condition (`'no_reply'`, `'no_open'`, `'no_click'`, `'all'`)
- If condition not met → skips to next step
- If no more steps → marks completed

#### Step 4: Select Gmail Account
```javascript
const account = await selectAccount(campaign.userId, campaign.accountIds);
// Round-robin selection based on dailySentCount
// Checks: dailySentCount < dailyLimit AND health !== 'critical'
```

#### Step 5-6: Build & Send Follow-up Email
- **Merge tags:** Uses contact data to replace merge tags
- **Add tracking:** Wraps links and adds tracking pixel
- **Creates EmailLog:** Records as `isFollowUp: true`, `followUpIndex: nextStepNumber`
- **Retrieves previous message ID:** [Line 245-250](server/src/services/followUpScheduler.js#L245-L250)
  ```javascript
  const previousLog = await EmailLog.findOne({
      campaignId: campaign._id,
      to: recipient.email.toLowerCase(),
      status: 'sent',
      messageId: { $ne: null }
  }).sort({ createdAt: -1 });
  const previousMessageId = previousLog?.messageId;
  ```

#### Step 7-8: Send via Appropriate Method
- **OAuth:** `replyViaOAuth(account, {to, originalSubject, htmlBody, plainBody, displayName, previousMessageId})`
- **Script:** `replyViaScript(account.scriptUrl, {...})`

#### Step 9-12: Update States
- Updates EmailLog with `status: 'sent'`, `sentAt`, `messageId`
- Updates account stats (dailySentCount, totalSent)
- Updates campaign stats
- Calculates next follow-up date and updates recipient state

**2-Second Delay Between Sends:** [Line 396](server/src/services/followUpScheduler.js#L396)
```javascript
await new Promise(r => setTimeout(r, 2000));
```

---

## 3. Thread Handling in Email Sending

### 3.1 Initial Email Send
**File:** [server/src/services/emailSender.js](server/src/services/emailSender.js#L33-L121)

**Threading Behavior:**
- Creates unique Message-ID: `<uuid@automindz.local>`
- **Does NOT set threading headers** (no In-Reply-To, no References)
- Creates new inbox entry with:
  ```javascript
  gmailMessageId: result.messageId
  gmailThreadId: `thread-${emailLog._id}`  // Custom thread ID fallback
  ```

⚠️ **ISSUE #1:** Initial emails don't expect to be part of a thread yet

### 3.2 OAuth Threaded Reply
**File:** [server/src/services/gmailOAuth.js](server/src/services/gmailOAuth.js#L148-255)

**Threading Strategy:** Uses two-level fallback

#### **Primary Method: Use previousMessageId (RFC Header)**
```javascript
if (previousMessageId) {
    inReplyTo = previousMessageId;
    // Search by RFC Message-ID: rfc822msgid:{messageId}
    const msg = await gmail.users.messages.list({
        q: `rfc822msgid:${previousMessageId}`,
        maxResults: 1,
    });
    if (msg.data.messages?.length > 0) {
        threadId = msg.data.messages[0].threadId;
    }
}
```

#### **Fallback Method: Search by Subject**
```javascript
if (!threadId) {
    const searchResult = await gmail.users.messages.list({
        q: `to:${to} subject:"${cleanSubject}" in:sent`,
        maxResults: 1,
    });
    if (searchResult.data.messages?.length > 0) {
        threadId = searchResult.data.messages[0].threadId;
        inReplyTo = msgId from original message
    }
}
```

**MIME Headers Set:**
```javascript
In-Reply-To: ${inReplyTo}        // Original message RFC ID
References: ${inReplyTo}         // Threading header
Subject: Re: ${cleanSubject}    // Adds "Re:" prefix
```

**Send Payload:**
```javascript
const sendPayload = { raw: encodedMessage };
if (threadId) sendPayload.threadId = threadId;  // Gmail API threading
```

**Return Value:**
```javascript
return { 
    success: true, 
    messageId: customMessageId,  // UUID@automindz.local
    threaded: !!inReplyTo        // Boolean indicating if threaded
};
```

### 3.3 Script-based Threaded Reply
**File:** [server/src/services/gmailScript.js](server/src/services/gmailScript.js#L67-104)

**Payload Sent to Google Apps Script:**
```javascript
const payload = {
    action: 'reply',
    to,
    originalSubject,
    htmlBody,
    plainBody,
    name: displayName,
    previousMessageId,  // Script handles threading logic
};
```

**Expects Script Response:**
```javascript
{
    success: true,
    messageId: data.messageId,
    threaded: data.threaded  // Script indicates if threading succeeded
}
```

⚠️ **ISSUE #2:** No validation that script actually implements threading

### 3.4 Email Log & Inbox Tracking
**File:** [server/src/models/EmailLog.js](server/src/models/EmailLog.js)

**Data Stored:**
- `messageId`: The custom/Google Message-ID returned from send
- `trackingId`: UUID for tracking opens/clicks (NOT used for threading)
- `isFollowUp`: Boolean flag
- `followUpIndex`: Which step in sequence

⚠️ **ISSUE #3:** `messageId` may be custom UUID, not actual RFC Message-ID

**File:** [server/src/models/InboxMessage.js](server/src/models/InboxMessage.js)

**Thread Storage:**
```javascript
gmailMessageId: String  // Gmail's actual message ID (if available)
gmailThreadId: String   // Gmail's thread ID (if available)
```

---

## 4. Identified Issues & Risks

### 🔴 CRITICAL ISSUES

#### **Issue #1: Message-ID Mismatch for Threading**
**Location:** [gmailOAuth.js Line 208](server/src/services/gmailOAuth.js#L208), [emailSender.js Line 82](server/src/services/emailSender.js#L82)

**Problem:**
- Initial email uses custom Message-ID: `<uuid@automindz.local>`
- EmailLog stores this custom ID, NOT the RFC Message-ID returned by Gmail
- Follow-up search uses RFC header `rfc822msgid:{customId}` which won't find it
- **Result:** Threading fails, each email is in separate thread

**Current Code:**
```javascript
// Initial send
return { success: true, messageId: customMessageId };  // <uuid@automindz.local>

// EmailLog stores custom ID
emailLog.messageId = result.messageId;  // NOT Gmail's actual messageId

// Follow-up search
q: `rfc822msgid:${previousMessageId}`,  // Searches for <uuid@automindz.local>
// This will FAIL because Gmail doesn't assign that Message-ID
```

**Fix Required:** Store BOTH custom ID and Gmail's returned ID

---

#### **Issue #2: Token Expiry Without User Notification**
**Location:** [gmailOAuth.js Line 85-95](server/src/services/gmailOAuth.js#L85-L95)

**Problem:**
- When token refresh fails, account health set to `'warning'` but not propagated to user
- User unaware their account will soon fail
- Follow-ups will fail silently

**Current Code:**
```javascript
if (isExpired && account.refreshToken) {
    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        // update...
    } catch (refreshError) {
        account.health = 'warning';
        await account.save();
        throw new Error(`Gmail token expired...`);
    }
}
```

**Missing:** 
- No UI notification queue
- No email alert to user
- No webhook to dashboard

---

#### **Issue #3: Missing Thread ID Recovery**
**Location:** [followUpScheduler.js Line 245-251](server/src/services/followUpScheduler.js#L245-L251)

**Problem:**
- Retrieves `messageId` but not `gmailThreadId` from EmailLog
- Has no way to pass threadId to reply functions
- Forces threading to rely on subject line search (unreliable)

**Current Code:**
```javascript
const previousLog = await EmailLog.findOne({
    campaignId: campaign._id,
    to: recipient.email.toLowerCase(),
    status: 'sent',
    messageId: { $ne: null }
}).sort({ createdAt: -1 });

const previousMessageId = previousLog?.messageId;
// Missing: no threadId available
```

**Fix Required:** 
- Store `gmailThreadId` in EmailLog after send
- Pass both `messageId` and `threadId` to reply functions

---

### 🟠 MAJOR ISSUES

#### **Issue #4: Subject-based Thread Search Unreliable**
**Location:** [gmailOAuth.js Line 188-201](server/src/services/gmailOAuth.js#L188-L201)

**Problem:**
- Fallback searches for subject in sent folder: `to:${to} subject:"${cleanSubject}" in:sent`
- Multiple campaigns with same recipient/subject will collide
- Original email may have been deleted
- Subject may have changed (Re:, Fwd:)

**Scenario:**
```
Campaign 1: "New Product Launch" to john@example.com
Following week: "New Product Launch" campaign to same email
Search finds Campaign 1's email instead of follow-up
```

---

#### **Issue #5: No Gmail API Response Processing**
**Location:** [gmailOAuth.js Line 225-237](server/src/services/gmailOAuth.js#L225-L237)

**Problem:**
- Gmail API returns actual `messageId` but custom ID is used instead
- No capture of actual threadId returned by Gmail
- Can't build accurate threading for future replies

**Current Code:**
```javascript
const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: sendPayload,
});

return { success: true, messageId: customMessageId, threaded: !!inReplyTo };
// result.data.id (Gmail's messageId) is IGNORED
// result.data.threadId is IGNORED
```

---

#### **Issue #6: Script Connection Has No Reply Implementation Check**
**Location:** [accounts.js Line 85-117](server/src/routes/accounts.js#L85-L117)

**Problem:**
- Script connection only validates basic "test" action
- Never validates that script supports "reply" action
- User unaware until follow-ups fail

---

### 🟡 MODERATE ISSUES

#### **Issue #7: Account Selection Doesn't Check Thread Consistency**
**Location:** [followUpScheduler.js Line 223](server/src/services/followUpScheduler.js#L223)

**Problem:**
- Round-robin selects DIFFERENT account for follow-up
- Original email sent from Account A, follow-up from Account B
- Different "From" addresses break threading
- Thread shown in different account's folder

**Scenario:**
```
User has:
- Account A: john@company.com (used for initial send)
- Account B: sales@company.com (used for follow-up)

Gmail recipient sees two different senders
```

---

#### **Issue #8: Tracking ID Confusion**
**Location:** [emailSender.js Line 52](server/src/services/emailSender.js#L52), [followUpScheduler.js Line 235](server/src/services/followUpScheduler.js#L235)

**Problem:**
- `trackingId` (UUID) is used for opens/clicks, NOT threading
- Code sometimes confuses trackingId with messageId
- No clear comments distinguishing their purposes

---

## 5. Summary Table

| Issue | Severity | File | Impact |
|-------|----------|------|--------|
| Message-ID mismatch breaks threading | CRITICAL | gmailOAuth.js, emailSender.js | Follow-ups always in new threads |
| Token refresh fails silently | CRITICAL | gmailOAuth.js | Unexpected failures, user unaware |
| No thread ID recovery in scheduler | CRITICAL | followUpScheduler.js | Can't pass threadId to reply |
| Subject search unreliable | MAJOR | gmailOAuth.js | Wrong thread replies possible |
| Gmail API response not captured | MAJOR | gmailOAuth.js | Can't store actual thread IDs |
| Script validation incomplete | MAJOR | accounts.js | Fail-blind on reply action |
| Wrong account used for follow-up | MODERATE | followUpScheduler.js | Different From: address breaks thread |
| Tracking vs Message ID confusion | MODERATE | Multiple files | Code maintenance risk |

---

## 6. Recommendations

### Priority 1 (Critical)
1. **Store actual Gmail messageId/threadId in EmailLog**
   - Add `gmailMessageId` field to EmailLog schema
   - Add `gmailThreadId` field to EmailLog schema
   - Capture from Gmail API response in `sendViaOAuth`

2. **Fix thread lookup in follow-ups**
   - Use `gmailThreadId` directly instead of searching
   - Use actual `gmailMessageId` for In-Reply-To header

3. **Add user notification for token expiry**
   - Create alert queue when health → 'warning'
   - Push SSE event to UI
   - Send email notification

### Priority 2 (High)
4. **Ensure account consistency**
   - Use same account for all replies in a sequence
   - Store `accountId` in first EmailLog, reuse it

5. **Validate script capabilities**
   - Test "reply" action during connection
   - Cache supported actions in GmailAccount

6. **Capture full Gmail response**
   - Extract `messageId`, `threadId` from response
   - Store both custom and actual IDs

