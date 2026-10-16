<?php
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
if (isset($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | Rasaviyana System</title>
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Custom CSS -->
    <link rel="stylesheet" href="login.css">
</head>

<body class="auth-body">
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <div class="auth-logo">
                    <i data-lucide="chef-hat"></i>
                </div>
                <h2>elcome Back</h2>
                <p>Sign in to your account</p>
            </div>

            <form id="login-form" class="auth-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <div class="input-icon-wrapper">
                        <i data-lucide="user" class="input-icon"></i>
                        <input type="text" id="username" name="username" placeholder="Enter your username" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="input-icon-wrapper">
                        <i data-lucide="lock" class="input-icon"></i>
                        <input type="password" id="password" name="password" placeholder="Enter your password" required>
                    </div>
                </div>

                <button type="submit" class="btn-primary btn-block btn-lg">
                    <span class="btn-text">Sign In</span>
                    <i data-lucide="log-in" class="btn-icon-right"></i>
                </button>
            </form>

            <div id="login-message" class="auth-message"></div>

            <div class="auth-footer">
                <p>Don't have an account? <a href="registration.html">Sign Up</a></p>
            </div>
        </div>
    </div>

    <!-- Logic -->
    <script src="login.js"></script>
</body>

</html>