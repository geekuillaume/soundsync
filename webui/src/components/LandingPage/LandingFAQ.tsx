import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AddIcon from '@material-ui/icons/Add';

import WhoAmIImage from 'res/whoami.jpg';

const useStyles = makeStyles((t) => ({
  root: {
    padding: 30,
  },
  faqContainer: {
    margin: 'auto',
    maxWidth: t.breakpoints.values.md,

    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 80,
  },
  title: {
    color: '#0060dd',
    fontSize: '1.6rem',
    fontFamily: '\'Sora\', sans-serif',
    marginBottom: 20,
  },
  question: {
    '&:before': {
      display: 'none',
    },
    '& .MuiIconButton-root.Mui-expanded': {
      transform: 'rotate(45deg)',
    },
  },
  questionTitle: {
    fontFamily: '\'Sora\', sans-serif',
  },
  whoAmI: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& p': {
      flex: 1,
    },
    '& img': {
      width: 150,
      height: 150,
      borderRadius: 150,
      marginRight: 20,
    },
  },
}));

const Question = ({ title, content }: {title: string; content: any}) => {
  const classes = useStyles();

  return (
    <Accordion className={classes.question}>
      <AccordionSummary expandIcon={<AddIcon />}>
        <p className={classes.questionTitle}>{title}</p>
      </AccordionSummary>
      <AccordionDetails>
        {content}
      </AccordionDetails>
    </Accordion>
  );
};

export const LandingFAQ = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.faqContainer}>
        <p className={classes.title}>
          FAQ
        </p>
        <Question
          title="Is it free?"
          content={(
            <p>
              Soundsync is free during the beta. Once it&apos;s stable enough, I&apos;ll need to find a way to generate money to continue working on it. My goal is to keep it free for most usage and put in place a pricing model for professionnal use. Anyway, the code will stay under the same license and you&apos;ll alway be free to tweak it.
            </p>
          )}
        />
        <Question
          title="Who's working on Soundsync?"
          content={(
            <div className={classes.whoAmI}>
              <img src={WhoAmIImage} />
              <p>
                For now, there is only one person working on Soundsync: me! I&apos;m Guillaume Besson, a french freelance developper who works with web technologies and tinkers with a lot of other things. I started Soundsync because I wanted to broadcast synchronized music in all the rooms in my home but didn&apos;t wanted to buy &quot;smart speakers&quot; which break all the time. If you like Soundsync and need a freelance developper,
                {' '}
                <a href="mailto:guillaume@besson.co">send me an email</a>
                !
              </p>
            </div>
          )}
        />
        <Question
          title="Is it Open-source ?"
          content={(
            <p>
              Soundsync code is released under the Business Source License. It is a special open-source compatible license which is 100% free to use as long as you don&apos;t use it for production work. It means you can use it at home, in your office but you cannot resell it or sell a service/product that directly use it. I&apos;m open to licensing it for a business usage,
              {' '}
              <a href="mailto:guillaume+soundsync@besson.co">contact me</a>
              {' '}
              to work out the details.
            </p>
          )}
        />
        <Question
          title="Does this work offline?"
          content={(
            <p>
              Every Soundsync peer (a device on which Soundsync is installed) can be used offline. Each peer will detect other peer on the local network with Bonjour and if connected to internet, will use a rendez-vous service to detect other peer with the same IP address. As Bonjour isn&apos;t available in a web browser, you need to connect to a peer on your local network with its IP and the port 6512 (for example
              {' '}
              <code>http://192.168.1.12:6512</code>
              ). Also note that you won&apos;t be able to use the webpage as an audio output because the page cannot be served in a `https` context.
            </p>
          )}
        />
        <Question
          title="I need an integration with X!"
          content={(
            <p>
              Soundsync being a free to use project, I cannot invest money into buying every kind of speakers to build integration for them. I&apos;ve listed the possible integrations above and you can create an issue if you do not see what you need. As the goal os Soundsync is to support every speaker combination, I'll be happy to work on the integration if someone sends me a compatible device.
              {' '}
              <a href="mailto:guillaume+soundsync@besson.co">Contact me</a>
              {' '}
              for the details.
            </p>
        )}
        />
        <Question
          title="How to install on a headless RaspberryPi?"
          content={(
            <p>
              Assuming you&apos;re using raspbian, first download the package with
              {' '}
              <code>wget https://github.com/geekuillaume/soundsync/releases/download/bleeding-edge/soundsync_0.1.0_armv7l.deb</code>
              , install it with
              {' '}
              <code>sudo dpkg -i ./soundsync_0.1.0_armv7l.deb</code>
              , if some dependencies are missing install them with
              {' '}
              <code>sudo apt-get install -f</code>
              {' '}
              than start Soundsync and activate it to be started at startup with
              {' '}
              <code>sudo systemctl enable --now soundsync.service</code>
              .
            </p>
          )}
        />
        <Question
          title="I need help!"
          content={(
            <p>
              The fatest way to get help is to
              {' '}
              <a href="https://discord.gg/j2BZ5KC">join the Discord server</a>
              {' '}
              and ask your question to the community. If you are a developper and find an issue in the code, you can create an issue on the
              {' '}
              <a href="https://github.com/geekuillaume/soundsync">Github repository</a>
            </p>
          )}
        />
        <Question
          title="How to integrate Soundsync in my product?"
          content={(
            <p>
              Soundsync is using the Business Source Licence, in short: you can use it freely for personnal use but you cannot use it as is for professionnal use. If you are a professionnal you can install Soundsync in your office freely but you cannot resell it to someone else. If you want to resell it or integrate it in products that you will commercialize, you need a special licence. In this case,
              {' '}
              <a href="mailto:guillaume+soundsync@besson.co">send me an email</a>
              {' '}
              and we&apos;ll work on the details.
            </p>
          )}
        />
      </div>
    </div>
  );
};
