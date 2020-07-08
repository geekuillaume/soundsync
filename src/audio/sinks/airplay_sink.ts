import bonjour from 'bonjour';

export const scanForAirplaySinks = () => {
  const detector = bonjour().find({
    type: 'raop',
    protocol: 'tcp',
  });


  detector.on('up', (e) => {
    console.log(e);
  });
};

scanForAirplaySinks();
