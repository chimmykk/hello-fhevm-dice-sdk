import { postDeploy } from '../postdeploy/index';

// Get command line arguments
const chainName = process.argv[2] || 'sepolia';
const contractName = process.argv[3] || 'FHEDiceGame';

console.log(`Running postdeploy for ${contractName} on ${chainName}...`);

try {
  postDeploy(chainName, contractName);
  console.log('Postdeploy completed successfully!');
} catch (error) {
  console.error(' Postdeploy failed:', error);
  process.exit(1);
}
