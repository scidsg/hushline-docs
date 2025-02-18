import Heading from '@theme/Heading';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Open Source',
    Svg: require('@site/static/img/git.svg').default,
    description: (
      <>
        Hush Line's source code is available on GitHub for transparency and verifiability.
      </>
    ),
  },
  {
    title: 'End-to-End Encrypted',
    Svg: require('@site/static/img/security.svg').default,
    description: (
      <>
        Hush Line uses OpenPGP.js to encrypt your messages in the browser before they are sent to our servers.
      </>
    ),
  },
  {
    title: 'Anonymity with Tor',
    Svg: require('@site/static/img/tor.svg').default,
    description: (
      <>
        Hush Line can be used entirely over the Tor network to further protect your identity.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
