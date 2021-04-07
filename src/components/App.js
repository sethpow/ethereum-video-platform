import React, { Component } from 'react';
import DVideo from '../abis/DVideo.json'
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  // Connecting app to blockchain; takes ethereum provider from metamask and injects into app
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  // Takes info from blockchain and puts it into the app
  async loadBlockchainData() {
    const web3 = window.web3
    //Load accounts
    const accounts = await web3.eth.getAccounts()
    console.log(accounts);
    //Add first account to the state
    this.setState({account: accounts[0]})


    //Get network ID; gives current network we are connected to
    const networkId = await web3.eth.net.getId()
    //Get network specific data
    const networkData = DVideo.networks[networkId]
    // Only do next line if network id exists; Check if net data exists, then...
    if(networkData){
      // Create "new" JS version of contract so fn's can be called; web3 contract using abi file
      // pass in ABI, and address/location of SC on blockchain; address of networkId will give us a copy of the smart contract
      const dvideo = new web3.eth.Contract(DVideo.abi, networkData.address)
      // console.log(dvideo) // logs the smart contract
      this.setState({ dvideo })

      const videosCount = await dvideo.methods.videoCount().call()
      this.setState({ videosCount })

      // Load videos, sorts by newest
      for (let i = videosCount; i >= 1; i--) {
        // uses videos mapping
        const video = await dvideo.methods.videos(i).call()
        this.setState({
          videos: [ ...this.state.videos, video ]
        })
      }

      // set latest video with title to view as default
      const latest = await dvideo.methods.videos(videosCount).call()
      this.setState({
        currentHash: latest.hash,
        currentTitle: latest.title
      })
      this.setState({ loading: false })

    } else {
      //If network data doesn't exists, log error
      window.alert('DVideo contract is not deployed to the detected network.')
    }
  }

  //Get video
  captureFile = event => {
    // convert file to a buffer object; get ready to be processed on IPFS
    event.preventDefault()

    // capture file
    const file = event.target.files[0]

    // convert file to a buffer
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    // add video to state
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer);
    }
  }

  //Upload video
  uploadVideo = title => {
    // Add file to IPFS
      // 1st, need a connection to IPFS; line 10

    // add to IPFS, get hash back to add to blockchain
    ipfs.add(this.state.buffer, (error, result) => {   // formatted file(in capture file), callback
      if(error){
        console.error(error);
        return;
      }

      // save hash to SC
      this.setState({ loading: true })// pass in IPFS hash and title;      who is sending the call
      this.state.dvideo.methods.uploadVideo(result[0].hash, title).send({ from: this.state.account }).on('transactionHash', () => {
        // after tx hash has come back, set loading to false
        this.setState({ loading: false })
      })
    })
  }

  //Change Video
  changeVideo = (hash, title) => {
    // set the state to the current video when we click on it
    this.setState({ 'currentHash': hash })
    this.setState({ 'currentTitle': title })
  }

  constructor(props) {
    super(props)
    this.state = {
      //set states
      buffer: null,
      account: "",
      dvideo: null,
      videos: [],
      loading: true,
      currentHash: null,
      currentTitle: null
    }

    //Bind functions
    this.uploadVideo = this.uploadVideo.bind(this)
    this.captureFile = this.captureFile.bind(this)
    this.changeVideo = this.changeVideo.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar 
          //Account
          account={this.state.account}
        />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              videos={this.state.videos}
              captureFile={this.captureFile}
              uploadVideo={this.uploadVideo}
              changeVideo={this.changeVideo}
              currentHash={this.state.currentHash}
              currentTitle={this.state.currentTitle}
            />
        }
      </div>
    );
  }
}

export default App;