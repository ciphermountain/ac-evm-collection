const NFT = artifacts.require("ERC721EnumerablePausable");

module.exports = async (deployer, network, addresses) => {
	await deployer.deploy(NFT, "example project", "TTTT", "https://nft.ciphermtn.com/", { gasPrice: 20000000000 });
}