import snmp from 'net-snmp';
//@ts-ignore
import { promisify } from 'util';

interface IGateController {
  target?: {
    ip: string;
    port?: number;
  };
  community?: string;
  oid?: {
    status: string;
    open: string;
    close: string;
  };
}

// A Node-style error-first callback
type NodeCallback<T> = (err: Error | null, result?: T) => void;

type VarBind = { oid: string; type: string; value: string };

const defaultConfig = {
  target: {
    ip: '127.0.0.1'
  },
  community: 'MDOTnet2000',
  oid: {
    status: '1.3.6.1.4.1.13669.2.2.1.3.1.0',
    open: '1.3.6.1.4.1.13669.1.5.1.12',
    close: '1.3.6.1.4.1.13669.1.5.1.27'
  }
};

export default class DeviceClient {
  private device: {
    get: (oid: string[], cb: NodeCallback<VarBind[]>) => void;
    set: (varbinds: VarBind[], cb: NodeCallback<string[]>) => void;
    close: () => void;
  };
  constructor(private config?: IGateController) {
    this.config = { ...defaultConfig, ...config };
  }

  async openOrClose(action: 'open' | 'close' = 'open') {
    const device = snmp.createSession(this.config.target.ip, this.config.community, { port: this.config.target.port }); // may be need to assign default port

    try {
      const varbinds = await promisify(device.get).call(device, [this.config.oid.status]);
      if (!varbinds.length) throw new Error('No varbinds returned');
      if (snmp.isVarbindError(varbinds[0])) throw new snmp.varbindError(varbinds[0]);
      const statusIndex = String(varbinds[0].value);
      const varbindsToSend = [
        {
          oid: `1.3.6.1.4.1.13669.2.2.1.1.1.3.0.${statusIndex}`,
          type: snmp.ObjectType.OctetString,
          value: this.config.oid[action]
        },
        {
          oid: `1.3.6.1.4.1.13669.2.2.1.1.1.4.0.${statusIndex}`,
          type: snmp.ObjectType.OctetString,
          value: 'SOC00001'
        },
        {
          oid: `1.3.6.1.4.1.13669.2.2.1.1.1.5.0.${statusIndex}`,
          type: snmp.ObjectType.OctetString,
          // Use an empty string instead of an empty Buffer
          value: ''
        },
        {
          oid: `1.3.6.1.4.1.13669.2.2.1.1.1.6.0.${statusIndex}`,
          type: snmp.ObjectType.Integer,
          value: 0
        },
        {
          oid: `1.3.6.1.4.1.13669.2.2.1.1.1.7.0.${statusIndex}`,
          type: snmp.ObjectType.Integer,
          value: 1
        }
      ];
      const actionVarbinds = await promisify(device.set).call(device, varbindsToSend);
      if (actionVarbinds.some((vb) => snmp.isVarbindError(vb))) {
        const errorToThrow = actionVarbinds.reduce((errors: any[], curr: any) => {
          if (snmp.isVarbindError(curr)) {
            errors.push(snmp.varbindError(curr));
          }
          return errors;
        }, []);
        throw errorToThrow;
      }
    } finally {
      device.close();
    }
  }
}
