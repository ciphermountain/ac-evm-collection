const NFT = artifacts.require("ERC721EnumerablePausable");

module.exports = async (deployer, network, addresses) => {
	await deployer.deploy(NFT, "The AC Collabs", "ACC", "https://nft.ciphermtn.com/theac/");
}
