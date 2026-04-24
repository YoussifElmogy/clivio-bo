import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import InjectablesInventoryPanel from './InjectablesInventoryPanel';
import MachinesInventoryPanel from './MachinesInventoryPanel';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') === 'machines' ? 1 : 0;
  const [tab, setTab] = useState(tabFromUrl);
  const [injectablesTotal, setInjectablesTotal] = useState(null);
  const [machinesTotal, setMachinesTotal] = useState(null);

  useEffect(() => {
    setTab(searchParams.get('tab') === 'machines' ? 1 : 0);
  }, [searchParams]);

  const handleTabChange = (_, value) => {
    setTab(value);
    if (value === 1) {
      setSearchParams({ tab: 'machines' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <FormPageShell
      title="Inventory"
      description="Manage injectables (products) and machines."
      paperSx={{ p: { xs: 2, sm: 3 } }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={handleTabChange} aria-label="Inventory sections">
          <Tab label="Injectables" id="inventory-tab-injectables" aria-controls="inventory-panel-injectables" />
          <Tab label="Machines" id="inventory-tab-machines" aria-controls="inventory-panel-machines" />
        </Tabs>
      </Box>

      {tab === 0 ? (
        <div role="tabpanel" id="inventory-panel-injectables" aria-labelledby="inventory-tab-injectables">
          <Stack direction="row"  spacing={3} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/inventory/new')} sx={{ borderRadius: 2 }}>
              Add injectable
            </Button>
            {injectablesTotal != null ? (
              <Typography sx={{ fontWeight: 600 ,color: 'text.secondary',fontSize: '1.15rem'}}>
                Total({injectablesTotal})
              </Typography>
            ) : null}
          </Stack>
          <InjectablesInventoryPanel onListCountChange={setInjectablesTotal} />
        </div>
      ) : (
        <div role="tabpanel" id="inventory-panel-machines" aria-labelledby="inventory-tab-machines">
          <Stack direction="row" spacing={3} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/inventory/machines/new')} sx={{ borderRadius: 2 }}>
              Add machine
            </Button>
            {machinesTotal != null ? (
              <Typography sx={{ fontWeight: 600 ,color: 'text.secondary',fontSize: '1.15rem'}}>
                Total({machinesTotal})
              </Typography>
            ) : null}
          </Stack>
          <MachinesInventoryPanel onListCountChange={setMachinesTotal} />
        </div>
      )}
    </FormPageShell>
  );
}
