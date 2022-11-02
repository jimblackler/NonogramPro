import axios from 'axios';
import './globals';

function promptForName(suggestedName: string, question: string) {
  const requestedScreenName =
      prompt(question, suggestedName);
  axios.post('/setScreenName', {requestedScreenName})
      .then(response => response.data as string | undefined)
      .then(response => {
        if (response) {
          promptForName(response, 'Names must be valid and unique. Please try again.');
        } else {
          location.reload();
        }
      }).catch(err => alert('There was an error setting the screen name. Apologies.'));
}

const {suggestedScreenName} = clientPageData;
if (suggestedScreenName) {
  setTimeout(() =>
      promptForName(suggestedScreenName,
          'What screen name would you like to use?\nThis will be visible to other users.'), 100);
}
