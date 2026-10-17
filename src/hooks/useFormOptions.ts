import { useMemo } from 'react';
import { optionsService } from '../services/optionsService';

/**
 * Custom hook to provide centralized options to any Form / Page component.
 * Allows decoupling UI components completely from the data source.
 */
export const useFormOptions = () => {
  const affiliations = useMemo(() => optionsService.getAffiliations(), []);
  const recorderPositions = useMemo(() => optionsService.getPositions('recorder'), []);
  const executivePositions = useMemo(() => optionsService.getPositions('executive'), []);
  const executiveTitles = useMemo(() => optionsService.getExecutiveTitles(), []);
  const months = useMemo(() => optionsService.getMonths(), []);
  const topics = useMemo(() => optionsService.getTopics(), []);
  const communicationTypes = useMemo(() => optionsService.getCommunicationTypes(), []);
  const internalChannels = useMemo(() => optionsService.getInternalChannels(), []);
  const externalChannels = useMemo(() => optionsService.getExternalChannels(), []);
  const internalAudiences = useMemo(() => optionsService.getInternalAudiences(), []);
  const externalAudiences = useMemo(() => optionsService.getExternalAudiences(), []);
  const problemTypes = useMemo(() => optionsService.getProblemTypes(), []);
  const suggestionTypes = useMemo(() => optionsService.getSuggestionTypes(), []);
  const reportStatuses = useMemo(() => optionsService.getReportStatuses(), []);

  const getDepartments = (affiliation?: string) => {
    return optionsService.getDepartments(affiliation);
  };

  return {
    affiliations,
    getDepartments,
    recorderPositions,
    executivePositions,
    executiveTitles,
    months,
    topics,
    communicationTypes,
    internalChannels,
    externalChannels,
    internalAudiences,
    externalAudiences,
    problemTypes,
    suggestionTypes,
    reportStatuses
  };
};
