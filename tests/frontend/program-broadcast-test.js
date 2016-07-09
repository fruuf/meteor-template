import { Observable } from 'rxjs';
import sinon from 'sinon';

const broadcastProgramMessage = sinon.stub().returns(Observable.of(true));
const programBroadcastModule = rootImport('/imports/ui/containers/ProgramBroadcast', {
  '../meteor/program': {
    '@noCallThru': false,
    broadcastProgramMessage,
  },
});
const { createAudienceStream, createPostMessageTextResultStream } = programBroadcastModule;
const ProgramBroadcast = programBroadcastModule.default;

describe('audience stream', () => {
  it('should change on changeAudience', () => {
    const actionStream = cold('--m--', {
      m: { type: 'changeAudience', data: 'mentee' },
    });
    const audienceStream = createAudienceStream(actionStream);
    expectObservable(audienceStream).toBe('a-m--', {
      a: 'all',
      m: 'mentee',
    });
  });
});

describe('post message', () => {
  const actionStream = cold('--a--', {
    a: { type: 'postMessage' },
  });
  const postMessageTextStream = cold('-a---', {
    a: 'hello world',
  });
  const audienceStream = cold('a----', {
    a: 'all',
  });
  const programIdStream = cold('a----', {
    a: 'program:1',
  });

  it('should post a message', () => {
    const postMessageTextResultStream = createPostMessageTextResultStream(
      actionStream, postMessageTextStream, audienceStream, programIdStream
    );
    expectObservable(postMessageTextResultStream).toBe('--a--', {
      a: true,
    });

    postMessageTextResultStream.subscribe(() => {
      expect(broadcastProgramMessage.calledOnce).to.equal(true);
      const props = broadcastProgramMessage.getCall(0).args[0];
      expect(props.audience).to.equal('all');
    });
  });
});

// describe('session stubs', () => {
//
// })
//
// describe('<Loop /> component', function () {
//   let wrapper = null;
//
//   before(function () {
//     wrapper = mount(<ProgramBroadcast {...props} />);
//   });
//
//   it('is present and exists', function () {
//     expect(wrapper).to.be.present();
//     expect(wrapper).to.exist;
//   });
