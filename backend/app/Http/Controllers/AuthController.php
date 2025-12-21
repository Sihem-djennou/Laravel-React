<?php

namespace App\Http\Controllers;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ================= REGISTER =================
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }

    // ================= LOGIN =================
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user'    => $user,
            'token'   => $token
        ], 200);
    }

    // ================= LOGOUT =================
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    // ================= PROFILE =================
    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    // ================= SEND OTP =================
    public function sendOTP(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $otp = random_int(100000, 999999);

        // 🔥 MODIFICATION IMPORTANTE
        // Écriture directe en base (PAS Eloquent)
        User::where('id', $user->id)->update([
            'remember_token' => (string) $otp
        ]);

        require base_path('vendor/autoload.php');

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'farahchettab2@gmail.com';
            $mail->Password   = 'ueoohaotzabnirwz';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            $mail->setFrom('farahchettab2@gmail.com', 'Verification OTP');
            $mail->addAddress($request->email);

            $mail->isHTML(true);
            $mail->Subject = 'Votre code OTP';
            $mail->Body    = "Votre code OTP est : <b>$otp</b>";

            $mail->send();

            return response()->json(['message' => 'OTP envoyé avec succès']);

        } catch (Exception $e) {
            return response()->json(['error' => 'Erreur mail : '.$e->getMessage()], 500);
        }
    }

    // ================= VERIFY OTP =================
    public function verifyOTP(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required'
        ]);

        // 🔥 MODIFICATION IMPORTANTE
        // Lecture directe depuis la base
        $storedOtp = User::where('email', $request->email)
            ->value('remember_token');

        if (!$storedOtp) {
            return response()->json(['error' => 'Aucun OTP généré'], 400);
        }

        // 🔥 COMPARAISON SIMPLE (PAS STRICTE)
        if ((string)$request->otp != (string)$storedOtp) {
            return response()->json(['error' => 'OTP incorrect'], 400);
        }

        // 🔥 Nettoyage
        User::where('email', $request->email)->update([
            'remember_token' => null
        ]);

        return response()->json(['message' => 'OTP validé avec succès']);
    }
}
