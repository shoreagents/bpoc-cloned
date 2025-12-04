
interface UserNotificationData {
  id: string
  email: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  admin_level?: string | null
  created_at?: string | Date | null
  slug?: string | null
  username?: string | null
}

/**
 * Sends a notification to n8n webhook when a new user signs up
 * This function is fire-and-forget and won't block the main execution flow
 */
export async function notifyN8nNewUser(user: UserNotificationData) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('⚠️ N8N_WEBHOOK_URL is not set. Skipping user signup notification.')
    return
  }

  // Determine base URL for profile links
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.bpoc.io')

  // Try to build a public profile URL.
  // Only use slug/username so we don't create links for incomplete profiles.
  const profileSlug = user.slug || user.username || ''

  const profileUrl =
    profileSlug && profileSlug.length > 0
      ? `${baseUrl.replace(/\/+$/, '')}/${profileSlug}`
      : null

  // Construct the payload
  const payload = {
    event: 'user_signup',
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      admin_level: user.admin_level || 'user',
      created_at: user.created_at || new Date().toISOString(),
      profile_url: profileUrl
    },
    source: 'bpoc_app',
    timestamp: new Date().toISOString()
  }

  console.log('🚀 Sending user signup notification to n8n:', payload.user.email)

  // Fire and forget - don't await the result to prevent slowing down the signup
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  .then(response => {
    if (response.ok) {
      console.log('✅ n8n notification sent successfully')
    } else {
      console.warn(`⚠️ n8n notification failed with status: ${response.status}`)
    }
  })
  .catch(error => {
    console.error('❌ Error sending n8n notification:', error)
  })
}

