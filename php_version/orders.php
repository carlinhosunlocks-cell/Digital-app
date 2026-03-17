<?php
// php_version/orders.php
require_once 'config.php';
if (!isLoggedIn()) redirect('index.php');

$role = $_SESSION['user_role'];
$userId = $_SESSION['user_id'];

// Lógica de Criação
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $role === 'ADMIN') {
    $title = $_POST['title'];
    $customer = $_POST['customer'];
    $address = $_POST['address'];
    $priority = $_POST['priority'];
    $assigned = $_POST['assigned_to'];
    $date = $_POST['date'];

    $stmt = $pdo->prepare("INSERT INTO service_orders (title, customer_name, address, priority, assigned_to_id, order_date) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$title, $customer, $address, $priority, $assigned, $date]);
    redirect('orders.php?success=1');
}

// Busca Ordens
if ($role === 'ADMIN') {
    $orders = $pdo->query("SELECT o.*, u.name as technician FROM service_orders o LEFT JOIN users u ON o.assigned_to_id = u.id ORDER BY o.id DESC")->fetchAll();
} else {
    $stmt = $pdo->prepare("SELECT o.*, u.name as technician FROM service_orders o LEFT JOIN users u ON o.assigned_to_id = u.id WHERE o.assigned_to_id = ? ORDER BY o.id DESC");
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll();
}

$technicians = $pdo->query("SELECT id, name FROM users WHERE role = 'EMPLOYEE'")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Ordens de Serviço | Digital Equipamentos</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 min-h-screen flex">
    <!-- Sidebar (Reutilizada) -->
    <aside class="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div class="p-8">
            <div class="flex items-center gap-3 mb-10">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">D</div>
                <span class="font-black text-slate-800 tracking-tight">Digital</span>
            </div>
            <nav class="space-y-2">
                <a href="dashboard.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">Dashboard</a>
                <a href="orders.php" class="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">Ordens de Serviço</a>
                <a href="inventory.php" class="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition">Inventário</a>
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
                <h2 class="text-3xl font-black text-slate-800 tracking-tight">Ordens de Serviço</h2>
                <p class="text-slate-400 font-medium">Gerenciamento de manutenções e instalações.</p>
            </div>
            <?php if ($role === 'ADMIN'): ?>
            <button onclick="document.getElementById('modal').classList.remove('hidden')" class="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition">Nova Ordem</button>
            <?php endif; ?>
        </header>

        <section class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50">
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnico</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php foreach ($orders as $order): ?>
                    <tr class="hover:bg-slate-50 transition">
                        <td class="px-8 py-6 font-black text-slate-400 text-xs">#<?= $order['id'] ?></td>
                        <td class="px-8 py-6 font-bold text-slate-700"><?= $order['customer_name'] ?></td>
                        <td class="px-8 py-6 text-slate-500 text-sm"><?= $order['technician'] ?? 'Não atribuído' ?></td>
                        <td class="px-8 py-6">
                            <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase"><?= $order['status'] ?></span>
                        </td>
                        <td class="px-8 py-6">
                            <span class="text-xs font-bold text-slate-400"><?= $order['priority'] ?></span>
                        </td>
                        <td class="px-8 py-6">
                            <a href="order_details.php?id=<?= $order['id'] ?>" class="text-blue-600 font-bold text-xs uppercase tracking-widest">Detalhes</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>
    </main>

    <!-- Modal Nova Ordem -->
    <div id="modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
            <h3 class="text-2xl font-black text-slate-800 mb-6">Nova Ordem de Serviço</h3>
            <form method="POST" class="space-y-4">
                <input type="text" name="title" placeholder="Título do Serviço" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <input type="text" name="customer" placeholder="Nome do Cliente" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <textarea name="address" placeholder="Endereço Completo" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500"></textarea>
                <div class="grid grid-cols-2 gap-4">
                    <select name="priority" class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none">
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM" selected>Média</option>
                        <option value="HIGH">Alta</option>
                    </select>
                    <input type="date" name="date" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none">
                </div>
                <select name="assigned_to" class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none">
                    <option value="">Atribuir Técnico</option>
                    <?php foreach ($technicians as $tech): ?>
                    <option value="<?= $tech['id'] ?>"><?= $tech['name'] ?></option>
                    <?php endforeach; ?>
                </select>
                <div class="flex gap-4 pt-4">
                    <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                    <button type="submit" class="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-blue-100">Criar OS</button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
