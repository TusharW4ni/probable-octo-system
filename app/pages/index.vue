<script setup lang="ts">
import { authClient } from "../../composables/auth-client";

const toast = useToast();

// UI state can be: 'initial', 'otp-sent', 'logged-in'
const uiState = ref("initial");
const user = ref<any>(null);

const email = ref("");
const otp = ref(["", "", "", "", "", ""]);
const otpInputs = ref<HTMLInputElement[]>([]);

const isSubmitting = ref(false);

// --- Session Management ---

async function checkSession() {
  const { data } = await authClient.getSession();
  if (data?.user) {
    user.value = data.user;
    uiState.value = "logged-in";
    email.value = data.user.email || "";
  } else {
    uiState.value = "initial";
  }
}

// Check for existing session when the component is mounted
onMounted(() => {
  checkSession();
});

// --- Authentication Logic ---

async function sendOTP() {
  if (!email.value) {
    toast.add({
      title: "Email required",
      description: "Please enter your email address.",
      color: "error",
    });
    return;
  }
  isSubmitting.value = true;
  try {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: email.value,
      type: "sign-in",
    });

    if (error) throw new Error(error.message);

    toast.add({
      title: "OTP Sent",
      description: "Check your email for the OTP.",
      color: "success",
    });
    uiState.value = "otp-sent";
    // Focus the first OTP input
    await nextTick();
    otpInputs.value[0]?.focus();
  } catch (err: any) {
    toast.add({
      title: "Error sending OTP",
      description: err.message || "An unexpected error occurred.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function verifyOTP() {
  const otpCode = otp.value.join("");
  if (otpCode.length !== 6) {
    // toast.add({
    //   title: "Invalid OTP",
    //   description: "Please enter the 6-digit OTP.",
    //   color: "error",
    // });
    return;
  }
  isSubmitting.value = true;
  try {
    const { error } = await authClient.signIn.emailOtp({
      email: email.value,
      otp: otpCode,
    });

    if (error) throw new Error(error.message);

    toast.add({
      title: "Success!",
      description: "You are now logged in.",
      color: "success",
    });
    await checkSession(); // Refresh session data
  } catch (err: any) {
    toast.add({
      title: "Login Failed",
      description: err.message || "An unexpected error occurred.",
      color: "error",
    });
    otp.value = ["", "", "", "", "", ""]; // Reset OTP field
    otpInputs.value[0]?.focus();
  } finally {
    isSubmitting.value = false;
  }
}

async function logout() {
  isSubmitting.value = true;
  try {
    await authClient.signOut();
    toast.add({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      color: "success",
    });
    user.value = null;
    email.value = "";
    otp.value = ["", "", "", "", "", ""];
    uiState.value = "initial";
  } catch (err: any) {
    toast.add({
      title: "Logout Failed",
      description: err.message || "An unexpected error occurred.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

// --- OTP Input UI Handlers ---

function handleOtpInput(e: Event, index: number) {
  const input = e.target as HTMLInputElement;
  const value = input.value;
  otp.value[index] = value;

  if (value && index < otp.value.length - 1) {
    otpInputs.value[index + 1]?.focus();
  }

  if (otp.value.join("").length === 6) {
    verifyOTP();
  }
}

function handleOtpKeyDown(e: KeyboardEvent, index: number) {
  if (e.key === "Backspace" && !otp.value[index] && index > 0) {
    otpInputs.value[index - 1]?.focus();
  }
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();
  const pastedData = e.clipboardData?.getData("text").slice(0, 6);
  if (pastedData) {
    for (let i = 0; i < pastedData.length; i++) {
      otp.value[i] = pastedData[i];
    }
    otpInputs.value[pastedData.length - 1]?.focus();
  }
}
</script>

<template>
  <div
    class="w-screen h-screen flex flex-col justify-center items-center bg-gray-50 text-gray-800"
  >
    <div class="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
      <!-- Logged In State -->
      <div v-if="uiState === 'logged-in'" class="text-center">
        <h1 class="text-2xl font-bold">Hello, you're logged in!</h1>
        <p class="mt-2 text-gray-600">{{ user?.email }}</p>
        <UButton
          @click="logout"
          :loading="isSubmitting"
          block
          size="lg"
          class="mt-6"
        >
          Logout
        </UButton>
      </div>

      <!-- Logged Out / Initial States -->
      <div v-else>
        <h1 class="text-3xl font-bold font-serif text-center">Hello world!</h1>

        <!-- Initial State: Email Input -->
        <form
          v-if="uiState === 'initial'"
          @submit.prevent="sendOTP"
          class="mt-8 space-y-6"
        >
          <UInput
            v-model="email"
            type="email"
            placeholder="Enter your email"
            size="xl"
            icon="i-heroicons-envelope"
            :disabled="isSubmitting"
            class="w-full"
          />
          <UButton type="submit" :loading="isSubmitting" block size="lg">
            Send OTP
          </UButton>
        </form>

        <!-- OTP Sent State: OTP Input -->
        <form
          v-if="uiState === 'otp-sent'"
          @submit.prevent="verifyOTP"
          class="mt-8 space-y-6"
        >
          <p class="text-center text-sm text-gray-600">
            An OTP has been sent to <span class="font-medium">{{ email }}</span
            >.
          </p>
          <div class="flex justify-center gap-2" @paste="handlePaste">
            <input
              v-for="i in 6"
              :key="i"
              :ref="el => { if (el) otpInputs[i - 1] = el as HTMLInputElement }"
              v-model="otp[i - 1]"
              @input="handleOtpInput($event, i - 1)"
              @keydown="handleOtpKeyDown($event, i - 1)"
              type="text"
              maxlength="1"
              pattern="[0-9]"
              class="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              :disabled="isSubmitting"
            />
          </div>
          <UButton type="submit" :loading="isSubmitting" block size="lg">
            Verify OTP & Login
          </UButton>
        </form>
      </div>
    </div>
  </div>
</template>
