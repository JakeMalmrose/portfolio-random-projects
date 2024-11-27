import { Authenticator } from '@aws-amplify/ui-react';
import Gambling from './Gambling';

export default function GamblingMiddleware() {
  return (
    <Authenticator>
      <Gambling />
    </Authenticator>
  );
}
