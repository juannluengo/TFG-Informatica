const path = require('path');
const fs = require('fs');

const artifactPath = path.resolve(__dirname, '../artifacts/AcademicRecords.json');
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

module.exports = contractArtifact;