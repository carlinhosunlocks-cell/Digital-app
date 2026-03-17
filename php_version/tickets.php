<?php
// php_version/tickets.php
require_once 'config.php';
if (!isLoggedIn()) redirect('index.php');

$role = $_SESSION['user_role'];
$userId = $_SESSION['user_id'];

// Lógica de Criação (Cliente)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $role === 'CLIENT') {
    $subject = $_POST['subject'];
    $description = $_POST['description'];

    $stmt = $pdo->prepare("INSERT INTO tickets (client_id, subject, description) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $subject, $description]);
    redirect('tickets.php?success=1');
}

// Busca Tickets
if ($role === 'ADMIN') {
    $tickets = $pdo->query("SELECT t.*, u.name as client_name FROM tickets t JOIN users u ON t.client_id = u.id ORDER BY t.id DESC")->fetchAll();
} else {
    $stmt = $pdo->prepare("SELECT t.*, u.name as client_name FROM tickets t JOIN users u ON t.client_id = u.id WHERE t.client_id = ? ORDER BY t.id DESC");
    $stmt->execute([$userId]);
    $tickets = $stmt->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Suporte | Digital Equipamentos</title>
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
                <a href="tickets.php" class="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">Suporte</a>
            </nav>
        </div>
        <div class="mt-auto p-8 border-t border-slate-100">
            <a href="logout.php" class="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition">Sair</a>
        </div>
    </aside>

    <main class="flex-1 p-8 md:p-12 overflow-y-auto">
        <header class="flex justify-between items-center mb-12">
            <div>
                <h2 class="text-3xl font-black text-slate-800 tracking-tight">Central de Suporte</h2>
                <p class="text-slate-400 font-medium">Gerencie seus chamados e solicitações.</p>
            </div>
            <?php if ($role === 'CLIENT'): ?>
            <button onclick="document.getElementById('modal').classList.remove('hidden')" class="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition">Abrir Chamado</button>
            <?php endif; ?>
        </header>

        <section class="grid grid-cols-1 gap-6">
            <?php foreach ($tickets as $ticket): ?>
            <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket #<?= $ticket['id'] ?></span>
                        <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase"><?= $ticket['status'] ?></span>
                    </div>
                    <h3 class="text-xl font-black text-slate-800 mb-1"><?= $ticket['subject'] ?></h3>
                    <p class="text-slate-500 text-sm italic">Cliente: <?= $ticket['client_name'] ?></p>
                </div>
                <a href="ticket_details.php?id=<?= $ticket['id'] ?>" class="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition">Visualizar</a>
            </div>
            <?php endforeach; ?>
            <?php if (empty($tickets)): ?>
                <div class="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center">
                    <p class="text-slate-400 font-medium italic">Nenhum chamado encontrado.</p>
                </div>
            <?php endif; ?>
        </section>
    </main>

    <!-- Modal Abrir Chamado -->
    <div id="modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
            <h3 class="text-2xl font-black text-slate-800 mb-6">Novo Chamado de Suporte</h3>
            <form method="POST" class="space-y-4">
                <input type="text" name="subject" placeholder="Assunto do Chamado" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <textarea name="description" placeholder="Descreva o seu problema em detalhes..." required rows="5" class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500"></textarea>
                <div class="flex gap-4 pt-4">
                    <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                    <button type="submit" class="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-blue-100">Abrir Ticket</button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
