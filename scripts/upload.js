const fs = require("fs");
const ipfsAPI = require("ipfs-http-client");

const ipfs = ipfsAPI({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https",
});

const main = async () => {
  console.log("\n\n Loading plinft.json...\n");
  const artwork = JSON.parse(fs.readFileSync("../../plinft.json").toString());
  console.log("  Uploading " + artwork[0].name + "...");
  const stringJSON = JSON.stringify(artwork[0]);
  const uploaded = await ipfs.add(
    { path: "0.json", content: stringJSON },
    { wrapWithDirectory: true }
  );
  console.log(uploaded);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
