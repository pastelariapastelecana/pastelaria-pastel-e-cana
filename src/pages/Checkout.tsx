"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Loader2, CheckCircle2, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const { deliveryDetails, deliveryFee } = (location.state || {}) as {
    deliveryDetails?: {
      address: string;
      number: string;
      neighborhood: string;
      city: string;
      zipCode: string;
    };
    deliveryFee?: number | null;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  // Dados do pagador para o Mercado Pago
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');

  const totalWithDelivery = totalPrice + (deliveryFee || 0);

  useEffect(() => {
    if (items.length === 0 || !deliveryDetails || deliveryFee === undefined || deliveryFee === null) {
      toast.info('Por favor, revise seu carrinho e endereço de entrega.');
      navigate('/carrinho');
    }

    // Verifica se a página foi acessada após um retorno do Mercado Pago
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    if (status === 'approved') {
      setPaymentStatus('success');
      clearCart();
      toast.success('Pagamento aprovado! Seu pedido foi realizado.');
      // Limpa os parâmetros da URL para evitar reprocessamento
      navigate('/pagamento/sucesso', { replace: true });
    } else if (status === 'pending' || status === 'rejected') {
      setPaymentStatus('failed');
      toast.error('O pagamento não foi aprovado. Por favor, tente novamente.');
      navigate('/checkout', { replace: true }); // Volta para o checkout para tentar novamente
    }
  }, [items, navigate, deliveryDetails, deliveryFee, clearCart]);

  const constructFullAddress = (details?: typeof deliveryDetails) => {
    if (!details) return '';
    const { address, number, neighborhood, city, zipCode } = details;
    return `${address}, ${number}, ${neighborhood}, ${city} - ${zipCode}`;
  };

  const handleCheckoutProPayment = async () => {
    if (!deliveryDetails || deliveryFee === null) {
      toast.error('Detalhes de entrega ou taxa de frete ausentes. Por favor, retorne ao carrinho.');
      return;
    }
    if (!payerName.trim() || !payerEmail.trim()) {
      toast.error('Por favor, preencha seu nome e e-mail para finalizar o pedido.');
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      const mpItems = items.map(item => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: parseFloat(item.price.toFixed(2)),
      }));

      if (deliveryFee && deliveryFee > 0) {
        mpItems.push({
          title: 'Taxa de Entrega',
          quantity: 1,
          unit_price: parseFloat(deliveryFee.toFixed(2)),
        });
      }

      const response = await axios.post(`${BACKEND_URL}/api/create-payment`, {
        items: mpItems,
        payer: {
          name: payerName,
          email: payerEmail,
        },
      });

      if (response.data && response.data.init_point) {
        // Redireciona o usuário para o Checkout Pro do Mercado Pago
        window.location.href = response.data.init_point;
      } else {
        throw new Error('URL de checkout do Mercado Pago não recebida.');
      }
    } catch (error) {
      console.error('Erro ao criar preferência de pagamento no Mercado Pago:', error);
      toast.error('Ocorreu um erro ao finalizar o pedido. Tente novamente.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Se o pagamento foi um sucesso (após retorno do MP)
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <CheckCircle2 className="w-24 h-24 mx-auto text-accent mb-6" />
            <h2 className="text-3xl font-bold mb-4">Pedido Realizado com Sucesso!</h2>
            <p className="text-muted-foreground mb-8">
              Agradecemos a sua compra. Seu pedido está sendo preparado!
            </p>
            <Link to="/">
              <Button variant="hero" size="lg">
                Voltar para o Início
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!deliveryDetails || deliveryFee === undefined || deliveryFee === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <Loader2 className="w-24 h-24 mx-auto text-primary animate-spin mb-6" />
            <h2 className="text-3xl font-bold mb-4">Carregando detalhes do pedido...</h2>
            <p className="text-muted-foreground mb-8">
              Se o carregamento demorar, por favor, retorne ao carrinho.
            </p>
            <Button onClick={() => navigate('/carrinho')} variant="hero" size="lg">
              Voltar para o Carrinho
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPayerDetailsMissing = !payerName.trim() || !payerEmail.trim();
  const isCheckoutButtonDisabled = items.length === 0 || isPayerDetailsMissing || isLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Finalizar Pedido</h1>
            <p className="text-xl opacity-90">Confirme seus dados e finalize a compra</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Resumo do Pedido */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Seu Pedido</h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} x R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <span className="font-bold">R$ {(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 mt-4 space-y-2">
                {deliveryFee !== null && (
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Frete:</span>
                    <span className="font-medium text-accent">R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Endereço de Entrega (apenas exibição) */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Endereço de Entrega
              </h2>
              <p className="text-lg text-muted-foreground">
                {constructFullAddress(deliveryDetails)}
              </p>
              <Button variant="link" className="pl-0 mt-2" onClick={() => navigate('/carrinho')}>
                Alterar Endereço
              </Button>
            </div>

            {/* Dados do Pagador */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Dados do Pagador
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payerName">Nome Completo *</Label>
                  <Input
                    id="payerName"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payerEmail">E-mail *</Label>
                  <Input
                    id="payerEmail"
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Total e Botão Finalizar */}
            <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">R$ {totalPrice.toFixed(2)}</span>
                </div>
                {deliveryFee !== null && (
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Frete:</span>
                    <span className="font-medium text-accent">R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between text-2xl font-bold">
                  <span>Total a Pagar:</span>
                  <span className="text-primary">R$ {totalWithDelivery.toFixed(2)}</span>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleCheckoutProPayment}
                disabled={isCheckoutButtonDisabled}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  'Finalizar Compra com Mercado Pago'
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
