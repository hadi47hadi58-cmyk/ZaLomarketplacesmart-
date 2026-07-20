const fs = require('fs');
let content = fs.readFileSync('web/js/supabase-db-compat.js', 'utf8');

// Replace profiles role fetch with just users fetch
const roleFetchStart = content.indexOf("const { data: profileUser, error: profError } = await supabase");
const roleFetchEnd = content.indexOf("if (profileUser && profileUser.role)", roleFetchStart);
if (roleFetchStart !== -1 && roleFetchEnd !== -1) {
    // Actually we replaced this in the redirect patch earlier, let's just make sure
}

// Remove syncing to profiles in merchant approvals
const syncProfilesStart = content.indexOf("// Keep profiles table role, status, and wilaya perfectly in sync with the merchant request!");
const syncProfilesEnd = content.indexOf("} catch (err) {", syncProfilesStart);
if (syncProfilesStart !== -1 && syncProfilesEnd !== -1) {
    content = content.substring(0, syncProfilesStart) + "/* profiles table sync removed */\n        " + content.substring(syncProfilesEnd);
}

const syncProfilesStart2 = content.indexOf("// Also update profiles status and role");
const syncProfilesEnd2 = content.indexOf("} catch (err) {", syncProfilesStart2);
if (syncProfilesStart2 !== -1 && syncProfilesEnd2 !== -1) {
    content = content.substring(0, syncProfilesStart2) + "/* profiles table sync removed */\n            " + content.substring(syncProfilesEnd2);
}

fs.writeFileSync('web/js/supabase-db-compat.js', content);
console.log("Patched supabase-db-compat.js to remove profiles sync");
