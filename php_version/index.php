<?php
// php_version/index.php (Login)
require_once 'config.php';

if (isLoggedIn()) {
    redirect('dashboard.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];
        redirect('dashboard.php');
    } else {
        $error = 'E-mail ou senha incorretos.';
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | Digital Equipamentos</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-900 flex items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        <div class="text-center mb-10">
            <div class="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-200 mb-6">D</div>
            <h1 class="text-3xl font-black text-slate-800 tracking-tight">Digital Equipamentos</h1>
            <p class="text-slate-400 font-medium mt-2">Acesse a plataforma corporativa</p>
        </div>

        <?php if ($error): ?>
            <div class="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold text-center">
                <?= $error ?>
            </div>
        <?php endif; ?>

        <form method="POST" class="space-y-6">
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <input type="email" name="email" required placeholder="exemplo@digital.com" 
                    class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-700 font-medium">
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <input type="password" name="password" required placeholder="••••••••" 
                    class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-700 font-medium">
            </div>

            <button type="submit" class="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[0.99] transition-all uppercase text-xs tracking-widest">
                Entrar na Plataforma
            </button>
        </form>

        <div class="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
             <p class="text-[10px] text-slate-400 font-bold uppercase mb-2">Acesso Restrito</p>
             <p class="text-xs text-slate-500">O acesso não autorizado é monitorado.</p>
        </div>
    </div>
</body>
</html>
