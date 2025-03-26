import plotly.graph_objects as go

fig = go.Figure()

fig.add_trace(go.Bar(
    x=df['Category'],
    y=df['Count'],
    text=df['Count'],
    textposition='auto',
    width=0.6,
    marker_color='#1f77b4',
    name='Count'
))

# Update layout
fig.update_layout(
    title='Distribution of Categories',
    xaxis_title='Category',
    yaxis_title='Count',
    bargap=0.1,
    showlegend=False,
    height=600,
    margin=dict(t=50, b=50, l=50, r=50)
) 