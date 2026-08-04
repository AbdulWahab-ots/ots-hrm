import moment from 'moment-timezone';

// Single source of truth for the system's business timezone. Configurable via env
// so a future move away from America/New_York doesn't require another code sweep -
// but note DEVICE_TIMEZONE below is NOT the same knob: that one is a hardware fact
// (where the biometric device physically sits), never a business setting.
export const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/New_York';

// The biometric device is physically installed in Pakistan and reports raw punch
// times in Pakistan wall-clock regardless of what business timezone the company
// operates in - this never changes unless the device itself relocates.
export const DEVICE_TIMEZONE = 'Asia/Karachi';

export const nowBusiness = () => moment().tz(BUSINESS_TIMEZONE);

export const todayBusinessStr = (): string => nowBusiness().format('YYYY-MM-DD');

// Converts a raw biometric device date+time (Pakistan wall-clock) into the
// equivalent business-timezone wall-clock. The date can shift by ±1 day - e.g. a
// device punch at 05:35 AM PKT on day D+1 lands at 08:35 PM America/New_York on
// day D, since Karachi is 9-10 hours ahead of New York depending on DST - so callers
// must use the returned `date`, not the original device date, for everything
// downstream (persistence, "which calendar day is this attendance row for", etc).
export const convertDeviceTimeToBusiness = (
    deviceDateStr: string,
    time24: string
): { date: string; time: string } => {
    const deviceMoment = moment.tz(`${deviceDateStr} ${time24}`, 'YYYY-MM-DD HH:mm:ss', DEVICE_TIMEZONE);
    const businessMoment = deviceMoment.clone().tz(BUSINESS_TIMEZONE);
    return {
        date: businessMoment.format('YYYY-MM-DD'),
        time: businessMoment.format('HH:mm:ss'),
    };
};
