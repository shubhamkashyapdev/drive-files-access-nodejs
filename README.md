Steps:

1. Create a GCP account (if does not already exist)
2. Create a new project (ex: Trave BTA)
3. Go to APIs & Services and -> click on "Enable API & Service" -> enable the Google Drive API (search for it in the search bar)
4. Now go to "APIs & Services" -> Credentials -> Click on "Create Credentials" -> "Create a service account" (create a new service account with "Viewer" access)
5. Download the credentials json file (keep it safe)
6. Go to google drive -> navigate to the folder whose file needs to be accessed -> click on share -> add the service account email (find email [client_email] inside the downloaded json file)
