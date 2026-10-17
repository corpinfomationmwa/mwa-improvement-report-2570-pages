// Helpers for formatting text, channels, and audience in MWA Official PDF layout

import { CommunicationTopicItem, ExecutiveInfo, RecorderInfo } from '../types/mwa';

export function formatFullName(title?: string, name?: string, surname?: string): string {
  const cleanName = (name || '').trim();
  const cleanTitle = (title || '').trim();
  const cleanSurname = (surname || '').trim();

  if (cleanTitle && cleanName.startsWith(cleanTitle)) {
    return [cleanName, cleanSurname].filter(Boolean).join(' ').trim() || '-';
  }

  const parts = [cleanTitle, cleanName, cleanSurname].filter(Boolean);
  return parts.join(' ').trim() || '-';
}

export function formatSpeakerInfo(executive: ExecutiveInfo): {
  fullName: string;
  position: string;
  affiliationAndDept: string;
} {
  const fullName = formatFullName(executive.title, executive.name, executive.surname);
  const position = executive.position || '-';
  const affiliationAndDept = [executive.affiliation, executive.department].filter(Boolean).join(' / ') || '-';

  return { fullName, position, affiliationAndDept };
}

export function formatChannels(item: CommunicationTopicItem): string[] {
  const channels: string[] = [];

  // Support raw channel string from DataTab record
  if ((item as any).channel) {
    channels.push((item as any).channel);
  }
  if ((item as any).channels && Array.isArray((item as any).channels)) {
    channels.push(...(item as any).channels);
  }

  if (item.internalChannels && item.internalChannels.length > 0) {
    item.internalChannels.forEach((c) => {
      const formatted = c === 'อื่นๆ' && item.otherInternalChannel ? `${c} (${item.otherInternalChannel})` : c;
      if (!channels.includes(formatted)) {
        channels.push(formatted);
      }
    });
  }

  if (item.externalChannels && item.externalChannels.length > 0) {
    item.externalChannels.forEach((c) => {
      const formatted = c === 'อื่นๆ' && item.otherExternalChannel ? `${c} (${item.otherExternalChannel})` : c;
      if (!channels.includes(formatted)) {
        channels.push(formatted);
      }
    });
  }

  return channels.length > 0 ? channels : ['-'];
}

export function formatAudiences(item: CommunicationTopicItem): string[] {
  const audiences: string[] = [];

  // Support raw audience string from DataTab record
  if ((item as any).audience) {
    audiences.push((item as any).audience);
  }
  if ((item as any).audiences && Array.isArray((item as any).audiences)) {
    audiences.push(...(item as any).audiences);
  }

  if (item.internalAudiences && item.internalAudiences.length > 0) {
    item.internalAudiences.forEach((a) => {
      let formatted = a;
      if (a === 'บุคลากรภายใน กปน.' && item.internalAudienceDetails?.staff) {
        formatted = `${a} (${item.internalAudienceDetails.staff})`;
      } else if (a === 'อื่นๆ' && item.internalAudienceDetails?.other) {
        formatted = `${a} (${item.internalAudienceDetails.other})`;
      }
      if (!audiences.includes(formatted)) {
        audiences.push(formatted);
      }
    });
  }

  if (item.externalAudiences && item.externalAudiences.length > 0) {
    item.externalAudiences.forEach((a) => {
      let formatted = a;
      if (a === 'หน่วยงานภายนอก' && item.externalAudienceDetails?.externalOrg) {
        formatted = `${a} (${item.externalAudienceDetails.externalOrg})`;
      } else if (a === 'อื่นๆ' && item.externalAudienceDetails?.other) {
        formatted = `${a} (${item.externalAudienceDetails.other})`;
      }
      if (!audiences.includes(formatted)) {
        audiences.push(formatted);
      }
    });
  }

  return audiences.length > 0 ? audiences : ['-'];
}
