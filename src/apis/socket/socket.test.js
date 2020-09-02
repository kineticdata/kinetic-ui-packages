import WS from 'jest-websocket-mock';
import { Socket, SOCKET_STAGE, SOCKET_STATUS } from './socket';

const MOCK_SERVER = 'ws://localhost:1234';
const MOCK_TOKEN = 'JWT_TOKEN';

describe('socket', () => {
  let socket;
  let server;
  beforeEach(() => {
    server = new WS(MOCK_SERVER);
    socket = new Socket(MOCK_SERVER);
  });
  afterEach(() => {
    WS.clean();
  });

  describe('typical flow', () => {
    test('connect', async () => {
      const identifyCb = jest.fn();
      const disconnectCb = jest.fn();
      socket.on('identify', identifyCb);
      socket.on('disconnect', disconnectCb);

      expect(socket.stage).toBe(SOCKET_STAGE.CLOSED);
      expect(socket.status).toBe(SOCKET_STATUS.CLOSED);
      socket.connect(MOCK_TOKEN);
      expect(socket.stage).toBe(SOCKET_STAGE.CONNECTING);
      expect(socket.status).toBe(SOCKET_STATUS.CONNECTING);
      await server.connected;
      expect(socket.stage).toBe(SOCKET_STAGE.CONNECTING);
      expect(socket.status).toBe(SOCKET_STATUS.IDENTIFYING);

      // The Socket will send an identify automatically with the token.
      await expect(server).toReceiveMessage(
        `{"topic":"topichub","action":"identify","payload":{"token":"${MOCK_TOKEN}"},"ref":"${socket.ref}"}`,
      );
      // And the server will reply with an `ack-ok` - note the refs must match for it to know what
      // event the acknowledgement is for.
      await server.send(`{ "event": "ack-ok", "ref": "${socket.ref}" }`);

      expect(socket.stage).toBe(SOCKET_STAGE.IDENTIFIED);
      expect(socket.status).toBe(SOCKET_STATUS.IDENTIFIED);

      // Close and restart the mock.
      await server.close();
      await server.closed;
      WS.clean();
      server = new WS(MOCK_SERVER);

      expect(disconnectCb).toHaveBeenCalled();
      expect(socket.stage).toBe(SOCKET_STAGE.RECONNECTING);
      expect(socket.status).toBe(SOCKET_STATUS.RECONNECTING);
      await server.connected;

      expect(socket.stage).toBe(SOCKET_STAGE.RECONNECTING);
      expect(socket.status).toBe(SOCKET_STATUS.IDENTIFYING);

      await expect(server).toReceiveMessage(
        `{"topic":"topichub","action":"identify","payload":{"token":"${MOCK_TOKEN}"},"ref":"${socket.ref}"}`,
      );
      // And the server will reply with an `ack-ok` - note the refs must match for it to know what
      // event the acknowledgement is for.
      await server.send(`{ "event": "ack-ok", "ref": "${socket.ref}" }`);
      expect(identifyCb).toHaveBeenCalled();
      expect(socket.stage).toBe(SOCKET_STAGE.IDENTIFIED);
      expect(socket.status).toBe(SOCKET_STATUS.IDENTIFIED);
    });
  });
});
