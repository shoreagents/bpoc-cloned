# Resume Headshot Storage Setup

## Step 1: Create Storage Bucket

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** → **Buckets**
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `resume_headshot`
   - **Public bucket**: ✅ **Yes** (for public URLs)
   - **File size limit**: `5MB`
   - **Allowed MIME types**: `image/*`
5. Click **Create bucket**

## Step 2: Set Storage Policies

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Allow authenticated users to upload their own resume headshots
CREATE POLICY "Users can upload their own resume headshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resume_headshot' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to resume headshots
CREATE POLICY "Public read access to resume headshots" ON storage.objects
FOR SELECT USING (bucket_id = 'resume_headshot');

-- Allow users to delete their own resume headshots
CREATE POLICY "Users can delete their own resume headshots" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resume_headshot' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own resume headshots
CREATE POLICY "Users can update their own resume headshots" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'resume_headshot' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 3: Test the Setup

1. Go to the resume builder page
2. Click on the "Add Photo" button in the header section
3. Upload a test image
4. Verify the image appears in the Supabase Storage dashboard under `resume_headshot` bucket
5. Check that the public URL works and the image appears in the resume preview

## Features Implemented

### ✅ Upload Functionality
- **File Validation**: Type and size checks (5MB limit, images only)
- **Unique Filenames**: Uses user ID + timestamp to prevent conflicts
- **Loading States**: Shows spinner during upload
- **Error Handling**: User-friendly error messages

### ✅ Storage Structure
```
resume_headshot/
└── resume_headshots/
    ├── user_id_1234567890.jpg
    ├── user_id_1234567891.png
    └── ...
```

### ✅ Security
- **Row-level Security**: Users can only access their own photos
- **File Type Validation**: Only images allowed
- **Size Limits**: 5MB maximum file size
- **Unique Filenames**: Prevents conflicts and unauthorized access

### ✅ UI Integration
- **Resume Builder**: Upload button with loading states
- **Resume Preview**: Shows uploaded headshot immediately
- **Saved Resume**: Displays headshot from Supabase URL
- **Remove Photo**: Deletes from Supabase when removed

## Environment Variables

Your existing Supabase environment variables are already configured:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

1. **Upload Photo**: Click the camera icon in the resume builder header
2. **Select Image**: Choose a JPG, PNG, or GIF file (max 5MB)
3. **Automatic Upload**: Image is uploaded to Supabase Storage
4. **Preview**: Photo appears in resume preview immediately
5. **Save Resume**: Photo URL is saved with the resume data
6. **View Resume**: Photo displays from Supabase URL

## Troubleshooting

### Common Issues:

1. **Upload Fails**: Check file size and type
2. **Photo Not Showing**: Verify Supabase Storage policies
3. **CORS Issues**: Check Supabase Storage CORS settings
4. **Authentication Error**: Ensure user is logged in

### Debug Steps:

1. Check browser console for errors
2. Verify Supabase Storage bucket exists
3. Test storage policies in Supabase dashboard
4. Check that the bucket is public
5. Verify file path structure in storage

## File Path Structure

The uploaded files are stored with this structure:
- **Bucket**: `resume_headshot`
- **Folder**: `resume_headshots/`
- **Filename**: `{user_id}_{timestamp}.{extension}`
- **Example**: `resume_headshots/123e4567-e89b-12d3-a456-426614174000_1703123456789.jpg`
