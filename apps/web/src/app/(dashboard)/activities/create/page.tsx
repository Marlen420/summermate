"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createActivitySchema, type CreateActivityInput } from "@/lib/validation/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useCreateActivity } from "@/hooks/use-activities";
import { ActivityCategory, Mood, PriceLevel } from "@/types/enums";
import { categoryEmoji, moodEmoji } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { useState } from "react";

export default function CreateActivityPage() {
  const router = useRouter();
  const { mutateAsync: createActivity, isPending } = useCreateActivity();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      priceLevel: PriceLevel.FREE,
      latitude: 48.8566,
      longitude: 2.3522,
    },
  });

  const selectedCategory = watch("category");
  const selectedMood = watch("mood");
  const selectedPrice = watch("priceLevel");

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setValue("latitude", pos.coords.latitude);
      setValue("longitude", pos.coords.longitude);
    });
  };

  const onSubmit = async (data: CreateActivityInput) => {
    setError(null);
    try {
      const activity = await createActivity(data);
      router.push(`/activities/${activity.id}`);
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Failed to create activity"
          : "Failed to create activity";
      setError(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Activity</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Share something fun with the community
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Basic Info</h2>
          <Input
            label="Activity Title"
            placeholder="e.g. Sunrise hike at Montserrat"
            error={errors.title?.message}
            {...register("title")}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="flex min-h-24 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Tell people what this activity is about..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Object.values(ActivityCategory).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setValue("category", cat as ActivityCategory)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium ${
                  selectedCategory === cat
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <span className="text-2xl">{categoryEmoji(cat)}</span>
                <span className="truncate w-full text-center">
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </span>
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category.message}</p>
          )}
        </div>

        {/* Mood */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Vibe / Mood</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.values(Mood).map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => setValue("mood", mood as Mood)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedMood === mood
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <span>{moodEmoji(mood)}</span>
                <span>{mood.charAt(0) + mood.slice(1).toLowerCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date & Location */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Date & Location</h2>
          <Input
            label="Date & Time"
            type="datetime-local"
            error={errors.date?.message}
            {...register("date")}
          />
          <Input
            label="City"
            placeholder="e.g. Barcelona"
            {...register("city")}
          />
          <Input
            label="Address"
            placeholder="e.g. Parc de la Ciutadella"
            {...register("address")}
          />

          {/* Coordinates with detect button */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              error={errors.latitude?.message}
              {...register("latitude", { valueAsNumber: true })}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              error={errors.longitude?.message}
              {...register("longitude", { valueAsNumber: true })}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={detectLocation}
            className="w-full"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Use My Location
          </Button>
        </div>

        {/* Capacity & Price */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Capacity & Price</h2>
          <Input
            label="Max Participants (optional)"
            type="number"
            min={1}
            placeholder="Leave empty for unlimited"
            {...register("maxParticipants", { valueAsNumber: true })}
          />
          <div>
            <p className="text-sm font-medium mb-2">Price Level</p>
            <div className="flex gap-2">
              {[
                { val: PriceLevel.FREE, label: "Free" },
                { val: PriceLevel.CHEAP, label: "$" },
                { val: PriceLevel.MODERATE, label: "$$" },
                { val: PriceLevel.EXPENSIVE, label: "$$$" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setValue("priceLevel", val as PriceLevel)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    selectedPrice === val
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-2" loading={isPending}>
            Create Activity 🎉
          </Button>
        </div>
      </form>
    </div>
  );
}
