# n8n Integration Plan for User Signups

This document outlines the plan to connect user signups in the `bpoc` application to n8n, enabling automated Slack notifications.

## **Overview**
The goal is to trigger an n8n workflow whenever a new user (regular user or recruiter) is successfully added to the PostgreSQL `users` table. This will be achieved by adding a webhook call to the backend user creation logic.

## **Implementation Steps**

### **1. Create Notification Utility**
Create a reusable function to handle the communication with n8n.
- **File:** `bpoc/src/lib/n8n.ts`
- **Function:** `notifyN8nNewUser(user: User)`
- **Logic:**
  - Check if the `N8N_WEBHOOK_URL` environment variable is set.
  - Send a `POST` request to the webhook URL with user details (`id`, `email`, `full_name`, `admin_level`, `created_at`).
  - Use a non-blocking approach (don't `await` the fetch call) or wrap in a `try-catch` to ensure signup doesn't fail if n8n is down.

### **2. Integrate with User Sync (Regular Users)**
Trigger the notification when a regular user signs up and is synced to the database.
- **File:** `bpoc/src/lib/user-sync-server.ts`
- **Location:** Inside the `INSERT` block where new users are created.
- **Action:** Call `notifyN8nNewUser` with the newly created user data.

### **3. Integrate with Recruiter Signup**
Trigger the notification when a recruiter account is created.
- **File:** `bpoc/src/app/api/recruiter/signup/route.ts`
- **Location:** After the `INSERT` query executes successfully.
- **Action:** Call `notifyN8nNewUser` with the new recruiter data.

## **Environment Variables**
You will need to add the following variable to your `.env` (local) and Vercel/Railway project settings:

```bash
N8N_WEBHOOK_URL=your_n8n_webhook_url_here
```

## **Data Payload Structure**
The JSON payload sent to n8n will look like this:

```json
{
  "event": "user_signup",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "full_name": "John Doe",
    "admin_level": "user", // or "recruiter"
    "created_at": "2023-10-27T10:00:00Z"
  },
  "source": "bpoc_app"
}
```

## **n8n Workflow Setup (For Reference)**
1. **Webhook Node:** Listen for `POST` requests.
2. **Slack Node:**
   - **Authentication:** Connect your Slack account.
   - **Channel:** Select the target channel (e.g., `#new-signups`).
   - **Message:** Use expressions to format the message:
     ```
     🚀 *New User Signup!*
     *Name:* {{ $json.user.full_name }}
     *Email:* {{ $json.user.email }}
     *Role:* {{ $json.user.admin_level }}
     ```

