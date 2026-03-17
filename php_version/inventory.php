<?php
// php_version/inventory.php
require_once 'config.php';
if (!isLoggedIn()) redirect('index.php');

$role = $_SESSION['user_role'];

// Lógica de Adição
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $role === 'ADMIN') {
    $name = $_POST['name'];
    $sku = $_POST['sku'];
    $category = $_POST['category'];
    $quantity = $_POST['quantity'];
    $price = $_POST['price'];

    $stmt = $pdo->prepare("INSERT INTO inventory (name, sku, category, quantity, price) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$name, $sku, $category, $quantity, $price]);
    redirect('inventory.php?success=1');
}

$items = $pdo->query("SELECT * FROM inventory ORDER BY name ASC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Inventário | Digital Equipamentos</title>
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
                <a href="inventory.php" class="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">Inventário</a>
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
                <h2 class="text-3xl font-black text-slate-800 tracking-tight">Inventário de Peças</h2>
                <p class="text-slate-400 font-medium">Controle de estoque e suprimentos técnicos.</p>
            </div>
            <?php if ($role === 'ADMIN'): ?>
            <button onclick="document.getElementById('modal').classList.remove('hidden')" class="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition">Adicionar Item</button>
            <?php endif; ?>
        </header>

        <section class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50">
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço</th>
                        <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php foreach ($items as $item): ?>
                    <tr class="hover:bg-slate-50 transition">
                        <td class="px-8 py-6 font-bold text-slate-700"><?= $item['name'] ?></td>
                        <td class="px-8 py-6 text-slate-400 text-xs font-mono"><?= $item['sku'] ?></td>
                        <td class="px-8 py-6 font-bold <?= $item['quantity'] <= $item['min_quantity'] ? 'text-red-500' : 'text-slate-700' ?>">
                            <?= $item['quantity'] ?> <?= $item['unit'] ?>
                        </td>
                        <td class="px-8 py-6 text-slate-500 text-sm">R$ <?= number_format($item['price'], 2, ',', '.') ?></td>
                        <td class="px-8 py-6">
                            <?php if ($item['quantity'] <= $item['min_quantity']): ?>
                                <span class="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase">Estoque Baixo</span>
                            <?php else: ?>
                                <span class="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase">Em Dia</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>
    </main>

    <!-- Modal Adicionar Item -->
    <div id="modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
            <h3 class="text-2xl font-black text-slate-800 mb-6">Novo Item de Estoque</h3>
            <form method="POST" class="space-y-4">
                <input type="text" name="name" placeholder="Nome da Peça/Equipamento" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <input type="text" name="sku" placeholder="SKU / Código" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <div class="grid grid-cols-2 gap-4">
                    <input type="number" name="quantity" placeholder="Quantidade" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                    <input type="number" step="0.01" name="price" placeholder="Preço Unitário" required class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                </div>
                <input type="text" name="category" placeholder="Categoria (ex: Elétrica, Hidráulica)" class="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500">
                <div class="flex gap-4 pt-4">
                    <button type="button" onclick="document.getElementById('modal').classList.add('hidden')" class="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
                    <button type="submit" class="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-blue-100">Salvar Item</button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
