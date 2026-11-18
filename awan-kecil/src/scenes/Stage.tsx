import React from "react";
import { Character } from "../characters/Character";
import { EmotionCloud, Rain, hasRain } from "../world/Clouds";
import { Rainbow, Sparkles } from "../world/Rainbow";
import { world } from "../world/data";

/** Panggung data-driven: semua tokoh, awan emosi, hujan, pelangi dibaca dari world.json. */
export const Stage: React.FC = () => (
  <>
    {world.characters.map((c) => (
      <React.Fragment key={c.id}>
        <Character id={c.id} />
        {world.emotionClouds && <EmotionCloud id={c.id} />}
        {hasRain(c.id) && <Rain id={c.id} />}
      </React.Fragment>
    ))}
    <Rainbow />
    <Sparkles />
  </>
);
