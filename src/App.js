import React, { useEffect, useState, useRef, Component } from "react";
import "./App.css";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";
import { create } from "ipfs-http-client";
import SignatureCanvas from "react-signature-canvas"

const ipfsClient = create("https://ipfs.infura.io:5001/api/v0")

export const StyledButton = styled.button`
  padding: 8px;
`;


function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  const [NftName, setNftName] = useState("")
  const [NftDes, setNftDes] = useState("")
  const [NftImage, setNftImage] = useState("");
  let imgBuffer = "";

  const [NFTS, setNFTS] = useState([]);
  const elementRef = useRef();
  const ipfsBase = "https:ipfs.infura.io/ipfs/";


  const handleSubmit = (event) =>{
    event.preventDefault();

    
    console.log(NftName);
    console.log(NftDes);
    console.log(NftImage);

    const file = NftImage;
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () =>{
      const buffer = Buffer(reader.result);
      console.log(buffer);
      imgBuffer = buffer;
      console.log(imgBuffer);
      startMinting();
      
    }
    
  }
  

  const mint = (_uri) =>{
    blockchain.smartContract.methods
    .mint(blockchain.account, _uri)
    .send({from: blockchain.account}).once("error", (err) => {
      console.log(err);
      setLoading(false)
      setStatus("minting error")
    }).then((receipt) =>{
      console.log(receipt);
      setLoading(false)
      dispatch(fetchData(blockchain.account));
      setStatus("Successfully minted your NFT")
    });
  } 

  const createMetaDataAndMint = async (_name, _des, _imgBuffer) =>{
    setLoading(true)
    setStatus("Uploading to ipfs")
    console.log(_imgBuffer);
    try {
      const addedImage = await ipfsClient.add(_imgBuffer);
      console.log(addedImage);
      const metaDataObj = {
        name: _name,
        description: _des,
        image: ipfsBase + addedImage.path,
      }
      console.log(metaDataObj);
      // add metadata to ipfs
      const addedMetaData = await ipfsClient.add(JSON.stringify(metaDataObj));
    
      mint(ipfsBase + addedMetaData.path);
    } catch (error) {
      console.log(error);
      setLoading(false)
      setStatus("Uploading error ")
    }
  }

  const startMinting = () => {
    //dis line to pull name ans description for the input

    setLoading(true);
    createMetaDataAndMint(NftName, NftDes, imgBuffer);
  }
  const getImageData = () => {
    const canvasEl = elementRef.current;
    console.log(canvasEl);
    let dataUrl = canvasEl.toDataURL("image/png");
    const buffer = Buffer(dataUrl.split(",")[1], "base64");
    return buffer;
  }
  
  const fetchMetaDataForNFTs =() =>{
    setNFTS([]);
    data.allTokens.forEach((nft) => {
      fetch(nft.uri)
      .then((response) => response.json())
      .then((metaData) => {
        setNFTS((preState) => [
          ...preState,
          {id: nft.id, metaData: metaData},
        ]);
      })
      .catch((err) => {
        console.log(err);
      });
    });
  };

  useEffect(() => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  }, [blockchain.smartContract, dispatch]);

  useEffect(() => {
    fetchMetaDataForNFTs();
  }, [data.allTokens]);

  return (
    <s.Screen>
      {blockchain.account === "" || blockchain.smartContract === null ? (
        <s.Container flex={1} ai={"center"} jc={"center"}>
          <s.TextTitle>Connect to the Blockchain</s.TextTitle>
          <s.SpacerSmall />
          <StyledButton
            onClick={(e) => {
              e.preventDefault();
              dispatch(connect());
            }}
          >
            CONNECT
          </StyledButton>
          <s.SpacerSmall />
          {blockchain.errorMsg !== "" ? (
            <s.TextDescription>{blockchain.errorMsg}</s.TextDescription>
          ) : null}
        </s.Container>
      ) : (
        <s.Container flex={1} ai={"center"} style={{ padding: 24 }}>
          <s.TextTitle style={{ textAlign: "center" }}>
            Welcome to Cit NFT minter
          </s.TextTitle>
          {loading ? (
            <>
              <s.SpacerLarge/>
              <s.TextDescription style={{ textAlign: "center" }}>
              Loading
              </s.TextDescription>
            </>
          ): null}
          {status !== "" ? (
            <>
              <s.SpacerLarge/>
              <s.TextDescription style={{ textAlign: "center" }}>
              {status}
              </s.TextDescription>
            </>
          ): null}
          <s.SpacerLarge/>
          <form onSubmit={handleSubmit}>
            <s.TextDescription>
                NFT Name:
            </s.TextDescription>
            <s.InputField type="text" value={NftName} onChange={(e) => setNftName(e.target.value)}/>
            <s.SpacerLarge/>
            <s.TextDescription>
                NFT Description:
            </s.TextDescription>
            <s.InputField type="text" value={NftDes} onChange={(e) => setNftDes(e.target.value)}/>
            <s.SpacerLarge/>
            <s.InputField type="file" onChange={(e) => setNftImage(e.target.files[0])}/>
            <s.SpacerLarge/>
            <s.InputField type="submit" value="Mint" style={{paddingLeft:20, paddingRight:20 }}/>
          </form>
          {/* <s.SpacerLarge/>
          <StyledButton
            onClick={(e) => {
              e.preventDefault();
              startMinting();
            }}
          >
            Mint
          </StyledButton>
          <s.SpacerLarge/>
          <SignatureCanvas
            backgroundColor={"#fff"}
            canvasProps={{width:200, height:200}}
            ref={elementRef}
          /> */}

          <s.SpacerLarge/>
          {data.loading ? (
            <>
              <s.SpacerLarge/>
              <s.TextDescription style={{ textAlign: "center" }}>
              Loading
              </s.TextDescription>
            </>
          ): (
            NFTS.map((nft, index) => {
              return (
                <s.Container key={index}>
                  <s.TextTitle key={index}>{nft.metaData.name}</s.TextTitle>
                  <s.SpacerSmall/>
                  <img alt={nft.metaData.name} src={nft.metaData.image} width={100}/>
                  <s.SpacerSmall/>
                  <s.TextDescription style={{ textAlign: "center" }}>
                  {nft.metaData.description}
                  </s.TextDescription>
                  <s.SpacerSmall/>
                </s.Container>
              );
            })
          )}
        </s.Container>
          
      )}
    </s.Screen>
  );
}

export default App;
