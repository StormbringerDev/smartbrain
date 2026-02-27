import { useState } from 'react';
import ParticlesBg from 'particles-bg';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import Rank from './components/Rank/Rank';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import './App.css';

const MODEL_ID = 'face-detection';

const clarifaiRequestOptions = (imageUrl) => {
  // Your PAT (Personal Access Token) can be found in the Account's Security section
  const PAT = 'YOUR_PAT_HERE';
  // Specify the correct user_id/app_id pairings
  // Since you're making inferences outside your app's scope
  const USER_ID = 'clarifai';
  const APP_ID = 'main';
  // Change these to whatever model and image URL you want to use
  const IMAGE_URL = imageUrl;

  const raw = JSON.stringify({
    user_app_id: {
      user_id: USER_ID,
      app_id: APP_ID,
    },
    inputs: [
      {
        data: {
          image: {
            url: IMAGE_URL,
          },
        },
      },
    ],
  });

  const requestOptions = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: 'Key ' + PAT,
    },
    body: raw,
  };

  return requestOptions;
};

function App() {
  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [box, setBox] = useState({});
  const [route, setRoute] = useState('signin');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
  });

  const loadUser = (data) => {
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined,
    });
  };

  const calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputImage');

    if (!image) {
      console.warn('Image element not found');
      return { leftCol: 0, topRow: 0, rightCol: 0, bottomRow: 0 };
    }

    const width = Number(image.width);
    const height = Number(image.height);

    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - clarifaiFace.right_col * width,
      bottomRow: height - clarifaiFace.bottom_row * height,
    };
  };

  const displayFaceBox = (boxData) => {
    setBox(boxData);
  };

  const onInputChange = (event) => {
    setInput(event.target.value);
  };

  const onPictureSubmit = () => {
    setImageUrl(input);
    fetch(`https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`, clarifaiRequestOptions(input))
      .then((response) => response.json())
      .then((result) => {
        if (result) {
          fetch('http://localhost:3000/image', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
            }),
          })
            .then((response) => response.json())
            .then((count) => {
              Object.assign(user, { entries: count });
            })
            .catch(console.log);
        }
        displayFaceBox(calculateFaceLocation(result));
      })
      .catch((err) => console.log(err));
  };

  const onRouteChange = (newRoute) => {
    if (newRoute === 'signout') {
      setInput('');
      setImageUrl('');
      setBox({});
      setIsSignedIn(false);
      setUser({
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: '',
      });
    } else if (newRoute === 'home') {
      setIsSignedIn(true);
    }
    setRoute(newRoute);
  };

  return (
    <div className="App">
      <ParticlesBg type="cobweb" bg={true} />
      <Navigation isSignedIn={isSignedIn} onRouteChange={onRouteChange} />
      {route === 'home' ? (
        <div>
          <Logo />
          <Rank name={user.name} entries={user.entries} />
          <ImageLinkForm onInputChange={onInputChange} onPictureSubmit={onPictureSubmit} />
          <FaceRecognition imageUrl={imageUrl} box={box} />
        </div>
      ) : route === 'signin' || route === 'signout' ? (
        <Signin onRouteChange={onRouteChange} loadUser={loadUser} />
      ) : (
        <Register onRouteChange={onRouteChange} loadUser={loadUser} />
      )}
    </div>
  );
}

export default App;
