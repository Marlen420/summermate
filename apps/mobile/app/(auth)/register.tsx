import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const schema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  password: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Needs uppercase").regex(/[0-9]/, "Needs a number"),
  city: z.string().optional(),
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      const res = await api.post("/auth/register", data);
      const { user, accessToken, refreshToken } = res.data.data;
      await setAuth(user, accessToken, refreshToken);
      router.replace("/(tabs)/feed");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Registration failed");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Join SummerMate 🎉</Text>
          <Text style={styles.subtitle}>Start discovering activities today</Text>

          {(["email", "username", "password", "city"] as const).map((field) => (
            <Controller
              key={field}
              control={control}
              name={field}
              render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{field === "city" ? "City (optional)" : field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={field === "password"}
                    keyboardType={field === "email" ? "email-address" : "default"}
                    autoCapitalize={field === "email" || field === "password" ? "none" : "words"}
                    placeholder={
                      field === "email" ? "you@example.com" :
                      field === "username" ? "coolexplorer42" :
                      field === "password" ? "Min. 8 chars" : "e.g. Berlin"
                    }
                    placeholderTextColor="#9ca3af"
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />
          ))}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text style={styles.link}>Sign in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flexGrow: 1, padding: 24, gap: 14 },
  title: { fontSize: 26, fontWeight: "700", color: "#111827", marginTop: 24 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151" },
  input: { height: 48, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: "#111827", backgroundColor: "#f9fafb" },
  inputError: { borderColor: "#ef4444" },
  errorText: { fontSize: 12, color: "#ef4444" },
  errorBox: { backgroundColor: "#fef2f2", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorBoxText: { color: "#dc2626", fontSize: 13 },
  button: { height: 52, borderRadius: 14, backgroundColor: "#ff7c0a", alignItems: "center", justifyContent: "center", marginTop: 8, shadowColor: "#ff7c0a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerText: { color: "#6b7280", fontSize: 14 },
  link: { color: "#ff7c0a", fontSize: 14, fontWeight: "600" },
});
