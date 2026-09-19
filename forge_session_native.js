const { auth } = require("./.next/server/app/api/auth/[...all]/route.js");

async function run() {
  console.log(Object.keys(auth));
}
run();
