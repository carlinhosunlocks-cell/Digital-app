<?php
// php_version/dashboard.php
require_once 'config.php';

if (!isLoggedIn()) {
    redirect('index.php');
}

$role = $_SESSION['user_role'];
$userName = $_SESSION['user_name'];

// Estatísticas Rápidas (Exemplo Admin)
$stats = [];
if ($role === 'ADMIN') {
    $stats['orders'] = $pdo->query("SELECT COUNT(*) FROM service_orders")->fetchColumn();
    $stats['tickets'] = $pdo->query("SELECT COUNT(*) FROM tickets WHERE status = 'OPEN'")->fetchColumn();
    $stats['users'] = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | Digital Equipamentos</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div class="p-8">
            <div class="flex items-center gap-3 mb-10">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">D</div>
                <span class="font-black text-slate-800 tracking-tight">Digital</span>
            </div>

            <nav class="space-y-2">
                <a href="dashboard.php" class="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">
                    Dashboard
                </a>
                <a href="orders.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">
                    Ordens de Serviço
                </a>
                <a href="inventory.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">
                    Inventário
                </a>
                <?php if ($role === 'ADMIN'): ?>
                <a href="users.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">
                    Equipe
                </a>
                <?php endif; ?>
                <a href="tickets.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">
                    Suporte
                </a>
            </nav>
        </div>

        <div class="mt-auto p-8 border-t border-slate-100">
            <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div>
                    <p class="text-xs font-black text-slate-800"><?= $userName ?></p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><?= $role ?></p>
                </div>
            </div>
            <a href="logout.php" class="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition">
                Sair do Sistema
            </a>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8 md:p-12 overflow-y-auto">
        <header class="flex justify-between items-center mb-12">
            <div>
                <h2 class="text-3xl font-black text-slate-800 tracking-tight">Olá, <?= explode(' ', $userName)[0] ?>!</h2>
                <p class="text-slate-400 font-medium">Bem-vindo ao centro de comando.</p>
            </div>
            <div class="flex gap-4">
                <button class="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 shadow-sm">Notificações</button>
            </div>
        </header>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ordens Ativas</p>
                <h3 class="text-4xl font-black text-slate-800"><?= $stats['orders'] ?? 0 ?></h3>
            </div>
            <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suporte Aberto</p>
                <h3 class="text-4xl font-black text-slate-800"><?= $stats['tickets'] ?? 0 ?></h3>
            </div>
            <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Membros da Equipe</p>
                <h3 class="text-4xl font-black text-slate-800"><?= $stats['users'] ?? 0 ?></h3>
            </div>
        </div>

        <!-- Recent Activity / Table -->
        <section class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                <h4 class="font-black text-slate-800 uppercase text-xs tracking-widest">Últimas Ordens de Serviço</h4>
                <a href="orders.php" class="text-blue-600 font-bold text-xs uppercase tracking-widest">Ver Tudo</a>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50">
                            <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                            <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço</th>
                            <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php
                        $recentOrders = $pdo->query("SELECT * FROM service_orders ORDER BY id DESC LIMIT 5")->fetchAll();
                        foreach ($recentOrders as $order):
                        ?>
                        <tr class="hover:bg-slate-50 transition">
                            <td class="px-8 py-6 font-bold text-slate-700"><?= $order['customer_name'] ?></td>
                            <td class="px-8 py-6 text-slate-500 text-sm"><?= $order['title'] ?></td>
                            <td class="px-8 py-6">
                                <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase"><?= $order['status'] ?></span>
                            </td>
                            <td class="px-8 py-6">
                                <span class="text-xs font-bold text-slate-400"><?= $order['priority'] ?></span>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (empty($recentOrders)): ?>
                        <tr>
                            <td colspan="4" class="px-8 py-12 text-center text-slate-400 text-sm italic">Nenhuma ordem encontrada.</td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </section>
    </main>
</body>
</html>
