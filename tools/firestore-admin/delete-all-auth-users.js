'use strict';

/**
 * Deletes every Firebase Auth user in the project.
 * Uses GOOGLE_APPLICATION_CREDENTIALS for authentication.
 *
 * Usage:
 *   node delete-all-auth-users.js [--dry-run]
 *
 * --dry-run  Lists users that would be deleted without actually deleting them.
 */

const admin = require('firebase-admin');

const DRY_RUN = process.argv.includes('--dry-run');
const PROJECT_ID = 'us-tax-ebeb9';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: PROJECT_ID,
});

async function listAllUsers() {
  const uids = [];
  let pageToken;
  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    for (const user of result.users) {
      uids.push(user.uid);
      console.log(`  ${user.uid}  ${user.email ?? '(no email)'}`);
    }
    pageToken = result.pageToken;
  } while (pageToken);
  return uids;
}

async function deleteInBatches(uids) {
  const BATCH = 1000; // Firebase Admin deleteUsers limit
  let totalDeleted = 0;
  for (let i = 0; i < uids.length; i += BATCH) {
    const batch = uids.slice(i, i + BATCH);
    const result = await admin.auth().deleteUsers(batch);
    totalDeleted += result.successCount;
    if (result.failureCount > 0) {
      console.error(`  ${result.failureCount} deletions failed in this batch:`);
      for (const err of result.errors) {
        console.error(`    uid=${err.index} — ${err.error.message}`);
      }
    }
  }
  return totalDeleted;
}

(async () => {
  try {
    console.log(`Project: ${PROJECT_ID}`);
    console.log('Listing all Firebase Auth users...\n');
    const uids = await listAllUsers();

    if (uids.length === 0) {
      console.log('\nNo users found. Nothing to delete.');
      return;
    }

    console.log(`\nFound ${uids.length} user(s).`);

    if (DRY_RUN) {
      console.log('\n--dry-run: no users were deleted.');
      return;
    }

    console.log('Deleting...');
    const deleted = await deleteInBatches(uids);
    console.log(`\nDone. Deleted ${deleted} of ${uids.length} user(s).`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
})();
