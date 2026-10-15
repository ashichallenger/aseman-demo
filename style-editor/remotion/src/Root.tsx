import React from 'react';
import {Composition} from 'remotion';
import {FontTest} from './FontTest';
import {calcEditMetadata, Edit} from './core/Edit';
import {EditProps} from './core/types';

const JOB = 'jobs/20261015-gta6';
const STYLE_IDS = ['saye', 'zarbe', 'majalle', 'neon'];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Edit" component={Edit} width={1080} height={1920} fps={30} durationInFrames={300}
      defaultProps={{edlFile: `${JOB}/edl_saye.json`} as EditProps} calculateMetadata={calcEditMetadata} />
    {STYLE_IDS.map((id) => (
      <Composition key={id} id={`Gallery-${id}`} component={Edit} width={1080} height={1920} fps={30}
        durationInFrames={300} defaultProps={{edlFile: `${JOB}/gallery_${id}.json`} as EditProps}
        calculateMetadata={calcEditMetadata} />
    ))}
    <Composition id="FontTest" component={FontTest} width={1080} height={1920} fps={30} durationInFrames={30} />
  </>
);
