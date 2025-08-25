import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  AutoAwesome as AIIcon,
  Code as CodeIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Functions as FunctionIcon,
  Transform as TransformIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Lightbulb as SuggestionIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Types
interface TransformationRule {
  id: string;
  type: 'function' | 'condition' | 'calculation' | 'format';
  operation: string;
  parameters: Record<string, any>;
  description: string;
  order: number;
}

interface TransformationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: TransformationRule[];
  example: {
    input: any;
    output: any;
  };
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  result?: any;
}

interface AISuggestion {
  confidence: number;
  transformation: string;
  explanation: string;
  category: string;
  examples: string[];
}

interface TransformationBuilderProps {
  sourceField: {
    name: string;
    type: string;
    sampleValue: any;
  };
  targetField: {
    name: string;
    type: string;
    format?: string;
  };
  initialTransformation?: string;
  onSave: (transformation: string, rules: TransformationRule[]) => void;
  onCancel: () => void;
  onPreview?: (transformation: string) => Promise<any>;
  onGetAISuggestions?: (context: string) => Promise<AISuggestion[]>;
}

// Transformation Templates
const TRANSFORMATION_TEMPLATES: TransformationTemplate[] = [
  {
    id: 'uppercase',
    name: 'Convert to Uppercase',
    description: 'Convert text to uppercase',
    category: 'Text',
    rules: [{
      id: '1',
      type: 'function',
      operation: 'toUpperCase',
      parameters: {},
      description: 'Convert to uppercase',
      order: 1
    }],
    example: { input: 'hello world', output: 'HELLO WORLD' }
  },
  {
    id: 'date_format',
    name: 'Format Date',
    description: 'Convert date to ISO format',
    category: 'Date',
    rules: [{
      id: '1',
      type: 'function',
      operation: 'new Date().toISOString',
      parameters: {},
      description: 'Convert to ISO date',
      order: 1
    }],
    example: { input: '2024-01-15', output: '2024-01-15T00:00:00.000Z' }
  },
  {
    id: 'number_conversion',
    name: 'Number Conversion',
    description: 'Convert string to number with scaling',
    category: 'Number',
    rules: [{
      id: '1',
      type: 'calculation',
      operation: 'multiply',
      parameters: { factor: 1000 },
      description: 'Convert kg to grams',
      order: 1
    }],
    example: { input: '2.5', output: 2500 }
  },
  {
    id: 'conditional',
    name: 'Conditional Mapping',
    description: 'Map values based on conditions',
    category: 'Logic',
    rules: [{
      id: '1',
      type: 'condition',
      operation: 'if_then_else',
      parameters: { 
        condition: 'value > 100',
        trueValue: 'HIGH',
        falseValue: 'LOW'
      },
      description: 'Categorize based on value',
      order: 1
    }],
    example: { input: 150, output: 'HIGH' }
  }
];

// Draggable Rule Component
const DraggableRule: React.FC<{
  rule: TransformationRule;
  index: number;
  onUpdate: (rule: TransformationRule) => void;
  onDelete: (id: string) => void;
  moveRule: (dragIndex: number, hoverIndex: number) => void;
}> = ({ rule, index, onUpdate, onDelete, moveRule }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'rule',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'rule',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveRule(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <Card 
      ref={(node) => drag(drop(node))}
      sx={{ 
        mb: 1, 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ py: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <TransformIcon color="primary" fontSize="small" />
            <Typography variant="body2" fontWeight="medium">
              {rule.operation}
            </Typography>
            <Chip 
              label={rule.type} 
              size="small" 
              variant="outlined"
              color={
                rule.type === 'function' ? 'primary' :
                rule.type === 'condition' ? 'warning' :
                rule.type === 'calculation' ? 'success' : 'info'
              }
            />
          </Box>
          <Box>
            <IconButton size="small" onClick={() => onDelete(rule.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {rule.description}
        </Typography>
      </CardContent>
    </Card>
  );
};

// AI Suggestion Panel
const AISuggestionPanel: React.FC<{
  suggestions: AISuggestion[];
  loading: boolean;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onRefreshSuggestions: () => void;
}> = ({ suggestions, loading, onApplySuggestion, onRefreshSuggestions }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AIIcon color="primary" />
          <Typography variant="h6">AI Suggestions</Typography>
        </Box>
        <IconButton onClick={onRefreshSuggestions} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : suggestions.length === 0 ? (
        <Alert severity="info">
          No AI suggestions available. Try providing more context about your transformation needs.
        </Alert>
      ) : (
        <List>
          {suggestions.map((suggestion, index) => (
            <ListItem key={index} divider>
              <ListItemIcon>
                <Badge 
                  badgeContent={Math.round(suggestion.confidence * 100) + '%'} 
                  color={suggestion.confidence > 0.8 ? 'success' : 'warning'}
                >
                  <SuggestionIcon color="primary" />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={suggestion.transformation}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      {suggestion.explanation}
                    </Typography>
                    <Chip 
                      label={suggestion.category} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                }
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => onApplySuggestion(suggestion)}
              >
                Apply
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

// Template Library
const TemplateLibrary: React.FC<{
  templates: TransformationTemplate[];
  onApplyTemplate: (template: TransformationTemplate) => void;
}> = ({ templates, onApplyTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];
  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <Box>
      <Box mb={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Category"
          >
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Grid container spacing={2}>
        {filteredTemplates.map(template => (
          <Grid item xs={12} sm={6} key={template.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {template.description}
                </Typography>
                <Box mt={1}>
                  <Typography variant="caption" display="block">
                    Example: {JSON.stringify(template.example.input)} → {JSON.stringify(template.example.output)}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => onApplyTemplate(template)}
                  startIcon={<CopyIcon />}
                >
                  Use Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Main Transformation Builder Component
export const TransformationBuilder: React.FC<TransformationBuilderProps> = ({
  sourceField,
  targetField,
  initialTransformation = '',
  onSave,
  onCancel,
  onPreview,
  onGetAISuggestions
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [rules, setRules] = useState<TransformationRule[]>([]);
  const [generatedCode, setGeneratedCode] = useState(initialTransformation);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true });
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAILoading] = useState(false);
  const [testInput, setTestInput] = useState(JSON.stringify(sourceField.sampleValue));
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Generate code from rules
  const generateCodeFromRules = useCallback(() => {
    if (rules.length === 0) return 'value';
    
    let code = 'value';
    rules.forEach(rule => {
      switch (rule.type) {
        case 'function':
          if (rule.operation === 'toUpperCase') {
            code = `${code}.toUpperCase()`;
          } else if (rule.operation === 'toLowerCase') {
            code = `${code}.toLowerCase()`;
          } else if (rule.operation === 'new Date().toISOString') {
            code = `new Date(${code}).toISOString()`;
          }
          break;
        case 'calculation':
          if (rule.operation === 'multiply') {
            code = `parseFloat(${code}) * ${rule.parameters.factor}`;
          } else if (rule.operation === 'divide') {
            code = `parseFloat(${code}) / ${rule.parameters.factor}`;
          }
          break;
        case 'condition':
          if (rule.operation === 'if_then_else') {
            code = `(${rule.parameters.condition.replace('value', code)}) ? '${rule.parameters.trueValue}' : '${rule.parameters.falseValue}'`;
          }
          break;
      }
    });
    
    setGeneratedCode(code);
  }, [rules]);

  // Move rule in the list
  const moveRule = useCallback((dragIndex: number, hoverIndex: number) => {
    const dragRule = rules[dragIndex];
    const newRules = [...rules];
    newRules.splice(dragIndex, 1);
    newRules.splice(hoverIndex, 0, dragRule);
    setRules(newRules);
  }, [rules]);

  // Add new rule
  const addRule = (type: TransformationRule['type'], operation: string) => {
    const newRule: TransformationRule = {
      id: Date.now().toString(),
      type,
      operation,
      parameters: {},
      description: `${operation} transformation`,
      order: rules.length + 1
    };
    setRules([...rules, newRule]);
  };

  // Delete rule
  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  // Apply template
  const applyTemplate = (template: TransformationTemplate) => {
    setRules(template.rules);
  };

  // Apply AI suggestion
  const applyAISuggestion = (suggestion: AISuggestion) => {
    setGeneratedCode(suggestion.transformation);
    setIsAdvancedMode(true);
  };

  // Get AI suggestions
  const getAISuggestions = async () => {
    if (!onGetAISuggestions) return;
    
    setAILoading(true);
    try {
      const context = `Transform ${sourceField.name} (${sourceField.type}) to ${targetField.name} (${targetField.type}). Sample: ${sourceField.sampleValue}`;
      const suggestions = await onGetAISuggestions(context);
      setAISuggestions(suggestions);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setAILoading(false);
    }
  };

  // Test transformation
  const testTransformation = async () => {
    try {
      const testValue = JSON.parse(testInput);
      // Simple evaluation for demo - in production, use a safe evaluator
      const result = eval(generatedCode.replace(/value/g, JSON.stringify(testValue)));
      setPreviewResult(result);
      setValidationResult({ isValid: true, result });
    } catch (error: any) {
      setValidationResult({ 
        isValid: false, 
        error: error.message 
      });
    }
  };

  // Effects
  useEffect(() => {
    generateCodeFromRules();
  }, [generateCodeFromRules]);

  useEffect(() => {
    getAISuggestions();
  }, [sourceField, targetField]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Typography variant="h6">
            Transform: {sourceField.name} → {targetField.name}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isAdvancedMode}
                onChange={(e) => setIsAdvancedMode(e.target.checked)}
              />
            }
            label="Advanced Mode"
          />
        </Box>

        {/* Main Content */}
        <Box display="flex" gap={2} flex={1}>
          {/* Left Panel - Builder */}
          <Box flex={2}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Visual Builder" />
                <Tab label="Templates" />
                <Tab label="Code Editor" />
              </Tabs>

              <Box flex={1} p={2}>
                {/* Visual Builder Tab */}
                {activeTab === 0 && (
                  <Box>
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Drag and drop to reorder transformation steps:
                      </Typography>
                      <Box display="flex" gap={1} mb={2}>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => addRule('function', 'toUpperCase')}
                        >
                          Text Function
                        </Button>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => addRule('calculation', 'multiply')}
                        >
                          Calculation
                        </Button>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => addRule('condition', 'if_then_else')}
                        >
                          Condition
                        </Button>
                      </Box>
                    </Box>

                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {rules.map((rule, index) => (
                        <DraggableRule
                          key={rule.id}
                          rule={rule}
                          index={index}
                          onUpdate={(updatedRule) => {
                            setRules(rules.map(r => r.id === updatedRule.id ? updatedRule : r));
                          }}
                          onDelete={deleteRule}
                          moveRule={moveRule}
                        />
                      ))}
                    </Box>

                    {rules.length === 0 && (
                      <Alert severity="info">
                        Add transformation steps using the buttons above, or switch to Templates tab for pre-built patterns.
                      </Alert>
                    )}
                  </Box>
                )}

                {/* Templates Tab */}
                {activeTab === 1 && (
                  <TemplateLibrary
                    templates={TRANSFORMATION_TEMPLATES}
                    onApplyTemplate={applyTemplate}
                  />
                )}

                {/* Code Editor Tab */}
                {activeTab === 2 && (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      label="Transformation Code"
                      value={generatedCode}
                      onChange={(e) => setGeneratedCode(e.target.value)}
                      placeholder="Enter JavaScript-like transformation expression..."
                      helperText="Use 'value' to reference the input. Example: value.toUpperCase()"
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Right Panel - AI & Preview */}
          <Box flex={1} display="flex" flexDirection="column" gap={2}>
            {/* AI Suggestions */}
            <Box flex={1}>
              <AISuggestionPanel
                suggestions={aiSuggestions}
                loading={aiLoading}
                onApplySuggestion={applyAISuggestion}
                onRefreshSuggestions={getAISuggestions}
              />
            </Box>

            {/* Preview & Testing */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Test & Preview
              </Typography>
              
              <TextField
                fullWidth
                size="small"
                label="Test Input"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TestIcon />}
                onClick={testTransformation}
                sx={{ mb: 2 }}
              >
                Test Transformation
              </Button>

              {validationResult.isValid ? (
                previewResult !== null && (
                  <Alert severity="success" icon={<ValidIcon />}>
                    <Typography variant="body2">
                      <strong>Result:</strong> {JSON.stringify(previewResult)}
                    </Typography>
                  </Alert>
                )
              ) : (
                <Alert severity="error" icon={<ErrorIcon />}>
                  <Typography variant="body2">
                    <strong>Error:</strong> {validationResult.error}
                  </Typography>
                </Alert>
              )}

              <Box mt={2}>
                <Typography variant="caption" display="block" gutterBottom>
                  Generated Code:
                </Typography>
                <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                  <Typography variant="body2" fontFamily="monospace">
                    {generatedCode}
                  </Typography>
                </Paper>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Footer Actions */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => onSave(generatedCode, rules)}
            disabled={!validationResult.isValid}
          >
            Save Transformation
          </Button>
        </Box>
      </Box>
    </DndProvider>
  );
};

export default TransformationBuilder;
