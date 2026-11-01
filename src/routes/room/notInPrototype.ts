import { showToast } from '../../components';

/** What the prototype cannot do yet, said in a toast instead of a dead button. The desktop and phone rooms share it. */
export function notInPrototype(what: string): void {
  showToast(
    { title: `${what} isn’t part of this prototype yet`, description: 'In BigBlueButton it opens here.' },
    { timeout: 6000 },
  );
}
