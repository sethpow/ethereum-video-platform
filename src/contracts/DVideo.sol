pragma solidity ^0.5.0;

// governs application; upload videos, and store on IPFS
/*
	1. Model video
	2. Allow for storing of video
	3. Upload video
	4. List (all) video(s)
*/

contract DVideo {
	uint public videoCount = 0;
	string public name = "DVideo";

	// Store video hash on blockchain
	// List videos - public videos fn
	// Create id=>struct mapping; call videos, pass in id and get a video
	mapping(uint => Video) public videos;


	// Model the video
	//Create Struct
	struct Video{
		uint id;
		string hash;
		string title;
		address author;		// Ethereum/wallet address of user
	}


	//Create Event
	event VideoUploaded(
		uint id,
		string hash,
		string title,
		address author
	);

	constructor() public {
	}

	// Store video/IPFS hash
	function uploadVideo(string memory _videoHash, string memory _title) public {
		// Make sure the video hash exists
		require(bytes(_videoHash).length > 0);

		// Make sure video title exists
		require(bytes(_title).length > 0);

		// Make sure uploader address exists
		require(msg.sender != address(0));

		// Increment video id
		videoCount++;

		// Add video to the contract; saving uploadedVideo contents to the videos mapping
		videos[videoCount] = Video(videoCount, _videoHash, _title, msg.sender);

		// Trigger an event to know when video is uploaded
		emit VideoUploaded(videoCount, _videoHash, _title, msg.sender);

	}
}
