const fs = require("fs");

const contents = fs.readFileSync("ontology.json").toString("utf-8");
const obj = JSON.parse(contents);
const targets = obj.map(entry => entry.name);
fs.writeFileSync("classify_targets.json", JSON.stringify(targets));