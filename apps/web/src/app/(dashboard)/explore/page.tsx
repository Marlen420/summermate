"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { Shuffle, Loader2 } from "lucide-react";
import { Mood, PriceLevel } from "@/types/enums";
import { moodEmoji } from "@/lib/utils";

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  mood: string;
  date: string;
  city?: string | null;
  address?: string | null;
  priceLevel: string;
  latitude: number;
  longitude: number;
  maxParticipants?: number | null;
  creator: { id: string; username: string; avatarUrl?: string | null };
  _count: { participants: number; photos: number };
}

export default function ExplorePage() {
  const [selectedMood, setSelectedMood] = useState<string | undefined>();
  const [selectedBudget, setSelectedBudget] = useState<string | undefined>();
  const [groupSize, setGroupSize] = useState<number | undefined>();

  const { mutate: getRandom, data, isPending, reset } = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post("/api/random-activity", {
        mood: selectedMood,
        budget: selectedBudget,
        groupSize,
      });
      return data.data as { activities: Activity[]; relaxed: boolean };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Explore & Discover</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Let us surprise you with the perfect activity
        </p>
      </div>

      {/* Random activity generator */}
      <div className="rounded-2xl gradient-hero p-6 text-white space-y-4">
        <div className="flex items-center gap-2">
          <Shuffle className="w-5 h-5" />
          <h2 className="font-bold text-lg">Random Activity Generator</h2>
        </div>
        <p className="text-white/80 text-sm">
          Tell us your vibe and we'll find the perfect match
        </p>

        {/* Mood selector */}
        <div>
          <p className="text-sm font-semibold text-white/90 mb-2">Your vibe</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(Mood).map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(selectedMood === mood ? undefined : mood)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedMood === mood
                    ? "bg-white text-primary"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {moodEmoji(mood)} {mood.charAt(0) + mood.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Budget selector */}
        <div>
          <p className="text-sm font-semibold text-white/90 mb-2">Budget</p>
          <div className="flex gap-2">
            {[
              { val: PriceLevel.FREE, label: "Free" },
              { val: PriceLevel.CHEAP, label: "$" },
              { val: PriceLevel.MODERATE, label: "$$" },
              { val: PriceLevel.EXPENSIVE, label: "$$$" },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setSelectedBudget(selectedBudget === val ? undefined : val)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  selectedBudget === val
                    ? "bg-white text-primary"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => { reset(); getRandom(); }}
            loading={isPending}
            className="bg-white text-primary hover:bg-white/90 flex-1"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Surprise Me!
          </Button>
          {data && (
            <Button
              onClick={() => { reset(); getRandom(); }}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {isPending && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {data && !isPending && (
        <div className="space-y-4">
          {data.relaxed && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              💡 We relaxed some filters to find these suggestions for you
            </div>
          )}
          {data.activities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-4xl mb-3">🏖️</p>
              <p>No activities found. Try different preferences!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
