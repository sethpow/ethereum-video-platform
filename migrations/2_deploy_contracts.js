// puts smart contract on the blockchain

const DVideo = artifacts.require("DVideo");

module.exports = function(deployer) {
  deployer.deploy(DVideo);
};
