"use client";

import { useState } from "react";
import { useActivities } from "@/hooks/use-activities";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, SlidersHorizontal, Zap } from "lucide-react";
import { ActivityCategory, Mood, PriceLevel } from "@/types/enums";
import { categoryEmoji, moodEmoji } from "@/lib/utils";

const MOODS = Object.values(Mood);
const PRICES = Object.values(PriceLevel);
const CATEGORIES = Object.values(ActivityCategory).slice(0, 8);

export default function FeedPage() {
  const [selectedMood, setSelectedMood] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedPrice, setSelectedPrice] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError } = useActivities({
    mood: selectedMood,
    category: selectedCategory,
    priceLevel: selectedPrice,
    sort: "date",
    limit: 20,
  });

  const hasFilters = selectedMood || selectedCategory || selectedPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover Activities</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Find your next adventure
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={hasFilters ? "border-primary text-primary" : ""}
        >
          <SlidersHorizontal className="w-4 h-4 mr-1.5" />
          Filters
          {hasFilters && (
            <Badge variant="summer" className="ml-1.5 h-4 px-1 text-[10px]">
              On
            </Badge>
          )}
        </Button>
      </div>

      {/* Mood pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedMood(undefined)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            !selectedMood
              ? "gradient-summer text-white shadow-md"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          All Vibes
        </button>
        {MOODS.map((mood) => (
          <button
            key={mood}
            onClick={() => setSelectedMood(selectedMood === mood ? undefined : mood)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedMood === mood
                ? "gradient-summer text-white shadow-md"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {moodEmoji(mood)} {mood.charAt(0) + mood.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {categoryEmoji(cat)} {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Price</p>
            <div className="flex gap-2">
              {PRICES.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPrice(selectedPrice === p ? undefined : p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedPrice === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {p === "FREE" ? "Free" : p === "CHEAP" ? "$" : p === "MODERATE" ? "$$" : "$$$"}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedMood(undefined);
                setSelectedCategory(undefined);
                setSelectedPrice(undefined);
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Activity grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">😞</p>
          <p className="font-semibold">Failed to load activities</p>
          <p className="text-sm">Please try again later</p>
        </div>
      ) : data?.activities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">🏖️</p>
          <p className="font-semibold text-lg">No activities found</p>
          <p className="text-sm mt-1">Try changing your filters or create one yourself!</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total} activities found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
