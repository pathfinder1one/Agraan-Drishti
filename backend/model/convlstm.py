"""
ConvLSTM cell and multi-layer stack for spatiotemporal weather prediction.
Captures spatial patterns (convolution) + temporal evolution (LSTM) simultaneously.
"""
import torch
import torch.nn as nn


class ConvLSTMCell(nn.Module):
    """Single ConvLSTM cell — convolution-gated LSTM for grid data."""

    def __init__(self, input_channels, hidden_channels, kernel_size=3):
        super().__init__()
        self.hidden_channels = hidden_channels
        padding = kernel_size // 2

        # Combined gates: input, forget, output, cell candidate
        self.gates = nn.Conv2d(
            input_channels + hidden_channels,
            4 * hidden_channels,
            kernel_size=kernel_size,
            padding=padding,
            bias=True,
        )

    def forward(self, x, state):
        """
        Args:
            x: (batch, channels, H, W)
            state: (h, c) each (batch, hidden, H, W)
        Returns:
            (h_new, c_new)
        """
        h, c = state
        combined = torch.cat([x, h], dim=1)
        gates = self.gates(combined)

        i, f, o, g = gates.chunk(4, dim=1)
        i = torch.sigmoid(i)
        f = torch.sigmoid(f)
        o = torch.sigmoid(o)
        g = torch.tanh(g)

        c_new = f * c + i * g
        h_new = o * torch.tanh(c_new)
        return h_new, c_new

    def init_state(self, batch_size, height, width, device):
        return (
            torch.zeros(batch_size, self.hidden_channels, height, width, device=device),
            torch.zeros(batch_size, self.hidden_channels, height, width, device=device),
        )


class ConvLSTM(nn.Module):
    """Multi-layer ConvLSTM stack."""

    def __init__(self, input_channels, hidden_channels, num_layers=2, kernel_size=3):
        super().__init__()
        self.num_layers = num_layers

        layers = []
        for i in range(num_layers):
            in_ch = input_channels if i == 0 else hidden_channels
            layers.append(ConvLSTMCell(in_ch, hidden_channels, kernel_size))
        self.layers = nn.ModuleList(layers)

    def forward(self, x):
        """
        Args:
            x: (batch, seq_len, channels, H, W)
        Returns:
            output: last hidden state (batch, hidden, H, W)
            all_hidden: list of hidden states per timestep
        """
        B, T, C, H, W = x.shape
        device = x.device

        # Init states
        states = [layer.init_state(B, H, W, device) for layer in self.layers]

        all_hidden = []
        for t in range(T):
            inp = x[:, t]  # (B, C, H, W)
            for i, layer in enumerate(self.layers):
                h, c = layer(inp, states[i])
                states[i] = (h, c)
                inp = h  # Output of this layer feeds next
            all_hidden.append(h)

        return h, all_hidden
