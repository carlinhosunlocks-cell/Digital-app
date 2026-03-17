<?php
// php_version/users.php
require_once 'config.php';
checkRole('ADMIN');

// Lógica de Criação
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $role = $_POST['role'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $dept = $_POST['department'];

    $stmt = $pdo->prepare("INSERT INTO users (name, email, role, password, department) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$name, $email, $role, $password, $dept]);
    redirect('users.php?success=1');
}

$users = $pdo->query("SELECT * FROM users ORDER BY role ASC, name ASC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Equipe | Digital Equipamentos</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 min-h-screen flex">
    <aside class="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div class="p-8">
            <div class="flex items-center gap-3 mb-10">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">D</div>
                <span class="font-black text-slate-800 tracking-tight">Digital</span>
            </div>
            <nav class="space-y-2">
                <a href="dashboard.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">Dashboard</a>
                <a href="orders.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">Ordens de Serviço</a>
                <a href="inventory.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">Inventário</a>
                <a href="users.php" class="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">Equipe</a>
                <a href="tickets.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">Suporte</a>
            </nav>
        </div>
        <div class="mt-auto p-8 border-t border-slate-100">
            <a href="logout.php" class="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition">Sair</a>
        </div>
    </aside>

    <main class="flex-1 p-8 md:p-12 overflow-y-auto">
        <header class="flex justify-between items-center mb-12">
            <div>
                <h2 class="text-3xl font-black text-slate-800 tracking-tight">Gestão de Equipe</h2>
                <p class="text-slate-400 font-medium">Controle de acessos e colaboradores.</p>
            </div>
            <button onclick="document.getElementById('modal').classList.remove('hidden')" class="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition">Novo Membro</button>
        </header>

        <section class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50">
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php foreach ($users as $user): ?>
                    <tr class="hover:bg-slate-50 transition">
                        <td class="px-8 py-6 font-bold text-slate-700"><?= $user['name'] ?></td>
                        <td class="px-8 py-6 text-slate-500 text-sm"><?= $user['email'] ?></td>
                        <td class="px-8 py-6">
                            <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase"><?= $user['role'] ?></span>
                        </td>
                        <td class="px-8 py-6 text-slate-400 text-xs font-bold uppercase tracking-widest"><?= $user['department'] ?? '-' ?></td>
                        <td class="px-8 py-6">
                            <span class="w-2 h-2 rounded-full inline-block mr-2 <?= $user['status'] === 'active' ? 'bg-green-500' : 'bg-slate-300' ?>"></span>
                            <span class="text-xs font-bold text-slate-500 uppercase"><?= $user['status'] ?></span>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>
    </main>

    <!-- Modal Novo Usuário -->
    <div id="modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
            <h3 class="text-2xl font-black text-slate-800 mb-6">Novo Membro da Equipe</h3>
            <form method="POST" class="space-y-4">
                <input type="text" name="name" placeholder="Nome Completo" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <input type="email" name="email" placeholder="E-mail Corporativo" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <input type="password" name="password" placeholder="Senha Inicial" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <div class="grid grid-cols-2 gap-4">
                    <select name="role" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none">
                        <option value="EMPLOYEE">Funcionário/Técnico</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="CLIENT">Cliente</option>
                    </select>
                    <input type="text" name="department" placeholder="Departamento" class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none">
                </div>
                <div class="flex gap-4 pt-4">
                    <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                    <button type="submit" class="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-blue-100">Criar Conta</button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
