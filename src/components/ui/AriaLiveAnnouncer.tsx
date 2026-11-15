import React, { useEffect, useState } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { ALL_PLANETARY_SITES } from '../../modules/planetary-archaeology/data/planetarySites';

export const AriaLiveAnnouncer: React.FC = () => {
  const selectedArtifactId = useExperienceStore((s) => s.selectedArtifactId);
  const selectedComponentId = useExperienceStore((s) => s.selectedComponentId);
  const currentDestination = useExperienceStore((s) => s.currentDestination);
  const state = useExperienceStore((s) => s.state);

  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (selectedArtifactId) {
      const site = ALL_PLANETARY_SITES.find((s) => s.linkedArtifactStoryId === selectedArtifactId || s.id === selectedArtifactId);
      if (site) {
        setAnnouncement(`Selected space relic: ${site.name}. Mission: ${site.mission}, coordinates: ${site.latitudeFormatted}, ${site.longitudeFormatted}. Location status: ${site.locationConfidence}.`);
        return;
      }
      setAnnouncement(`Selected space artifact: ${selectedArtifactId}.`);
    } else if (selectedComponentId) {
      setAnnouncement(`Inspecting spacecraft sub-assembly: ${selectedComponentId}.`);
    } else if (state === 'PLANETARY_ARCHAEOLOGY') {
      setAnnouncement(`Now viewing 3D orbital globe for ${currentDestination}. Drag to rotate, scroll to zoom, click beacon pins to inspect.`);
    }
  }, [selectedArtifactId, selectedComponentId, currentDestination, state]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};
